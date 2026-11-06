const XLSX = require('xlsx');

class ExcelService {
  /**
   * Generates a downloadable Excel template buffer for quiz questions.
   */
  generateTemplate() {
    const data = [
      {
        'Question': 'What is 2+2?',
        'Option A': '3',
        'Option B': '4',
        'Option C': '5',
        'Option D': '6',
        'Correct Option': 'B',
        'Marks': 1
      },
      {
        'Question': 'Which sorting algorithm has average O(N log N) complexity and is stable?',
        'Option A': 'Quick Sort',
        'Option B': 'Bubble Sort',
        'Option C': 'Merge Sort',
        'Option D': 'Selection Sort',
        'Correct Option': 'C',
        'Marks': 2
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions Template');

    // Calculate column widths
    const maxLens = {
      'Question': 40,
      'Option A': 15,
      'Option B': 15,
      'Option C': 15,
      'Option D': 15,
      'Correct Option': 15,
      'Marks': 10
    };
    worksheet['!cols'] = Object.keys(maxLens).map(key => ({ wch: maxLens[key] }));

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Parses and validates the uploaded questions Excel file.
   * @param {Buffer} buffer - Excel file buffer
   * @returns {Object} { isValid: boolean, questions: Array, errors: Array }
   */
  parseAndValidateQuestions(buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Parse using defval to ensure empty cells are represented as empty strings
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    
    const errors = [];
    const questions = [];

    if (rows.length === 0) {
      return {
        isValid: false,
        questions: [],
        errors: [{ row: 1, errorList: ['The uploaded sheet contains no data.'] }]
      };
    }

    // Expected headers
    const expectedHeaders = ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Option', 'Marks'];
    const sheetHeaders = Object.keys(rows[0]);
    const missingHeaders = expectedHeaders.filter(h => !sheetHeaders.includes(h));

    if (missingHeaders.length > 0) {
      return {
        isValid: false,
        questions: [],
        errors: [{ row: 0, errorList: [`Missing required columns: ${missingHeaders.join(', ')}`] }]
      };
    }

    rows.forEach((row, index) => {
      const rowNum = index + 2; // Excel row numbering starts at 1, headers are row 1, data starts at row 2
      const rowErrors = [];

      const questionText = String(row['Question']).trim();
      const optionA = String(row['Option A']).trim();
      const optionB = String(row['Option B']).trim();
      const optionC = String(row['Option C']).trim();
      const optionD = String(row['Option D']).trim();
      const correctOption = String(row['Correct Option']).trim().toUpperCase();
      const marksVal = row['Marks'];

      // 1. Check for empty fields
      if (!questionText) rowErrors.push('Question text is required.');
      if (!optionA) rowErrors.push('Option A is required.');
      if (!optionB) rowErrors.push('Option B is required.');
      if (!optionC) rowErrors.push('Option C is required.');
      if (!optionD) rowErrors.push('Option D is required.');
      
      // 2. Validate correct option
      if (!correctOption) {
        rowErrors.push('Correct Option is required.');
      } else if (!['A', 'B', 'C', 'D'].includes(correctOption)) {
        rowErrors.push(`Invalid Correct Option "${correctOption}". Must be A, B, C, or D.`);
      }

      // 3. Validate marks
      let marks = parseInt(marksVal, 10);
      if (marksVal === '' || marksVal === undefined || marksVal === null) {
        rowErrors.push('Marks is required.');
      } else if (isNaN(marks) || marks <= 0) {
        rowErrors.push(`Invalid Marks "${marksVal}". Marks must be a positive integer.`);
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNum,
          question: questionText || `[Row ${rowNum}] Empty question`,
          errorList: rowErrors
        });
      } else {
        questions.push({
          questionText,
          optionA,
          optionB,
          optionC,
          optionD,
          correctOption,
          marks
        });
      }
    });

    return {
      isValid: errors.length === 0,
      questions: errors.length === 0 ? questions : [],
      errors
    };
  }
}

module.exports = new ExcelService();

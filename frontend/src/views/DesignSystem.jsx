import React, { useState } from 'react';
import { Button, Input, Select, Textarea, Badge, Card, Modal, DataTable, ProgressBar } from '../components/UI';
import { Info, HelpCircle } from 'lucide-react';

export default function DesignSystem() {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [inputError, setInputError] = useState('This field is required');

  const demoColumns = [
    { key: 'name', label: 'Student Name', sortable: true },
    { key: 'roll', label: 'Roll Number', sortable: true },
    { key: 'score', label: 'Score', sortable: true, render: (val) => `${val}/100` },
    { key: 'status', label: 'Status', render: (val) => (
      <Badge variant={val === 'Passed' ? 'success' : 'danger'}>{val}</Badge>
    )}
  ];

  const demoData = [
    { id: 1, name: 'John Doe', roll: 'CS-2026-001', score: 85, status: 'Passed' },
    { id: 2, name: 'Alice Johnson', roll: 'CS-2026-002', score: 92, status: 'Passed' },
    { id: 3, name: 'Bob Miller', roll: 'CS-2026-003', score: 45, status: 'Failed' },
    { id: 4, name: 'Diana Prince', roll: 'MA-2026-002', score: 99, status: 'Passed' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="border-b border-neutral-200 pb-6 mb-10">
        <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight">Design System</h1>
        <p className="text-neutral-500 mt-2 text-lg">
          Storybook-style design tokens and component guide for the Online Quiz application.
        </p>
      </div>

      {/* 1. Typography */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold text-neutral-800 mb-6 border-l-4 border-primary-500 pl-3">1. Typography</h2>
        <div className="bg-white border border-neutral-200 rounded-xl p-6 flex flex-col gap-6 shadow-premium">
          <div>
            <span className="text-xs font-semibold text-neutral-400 block mb-2">Display Font: Outfit</span>
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-extrabold text-neutral-900">Heading 1 (Outfit)</h1>
              <h2 className="text-3xl font-bold text-neutral-800">Heading 2 (Outfit)</h2>
              <h3 className="text-2xl font-semibold text-neutral-800">Heading 3 (Outfit)</h3>
              <h4 className="text-xl font-semibold text-neutral-800">Heading 4 (Outfit)</h4>
            </div>
          </div>
          <hr className="border-neutral-100" />
          <div>
            <span className="text-xs font-semibold text-neutral-400 block mb-2">Body Font: Inter</span>
            <p className="text-base text-neutral-700 leading-relaxed max-w-2xl">
              This is the body copy text in Inter. Standard sans-serif typeface optimized for UI readability, clean letter-spacing, and balanced margins.
            </p>
            <p className="text-sm text-neutral-500 mt-2">
              This is small/caption text in Inter. Used for meta descriptors and subheadings.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Color Palette */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold text-neutral-800 mb-6 border-l-4 border-primary-500 pl-3">2. Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Primary */}
          <Card title="Primary (Purple)" subtitle="Accent / Branding HSL">
            <div className="flex flex-col gap-2">
              <div className="h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white text-xs font-semibold">600 (Main)</div>
              <div className="h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-900 text-xs font-semibold">100 (Light)</div>
            </div>
          </Card>

          {/* Grays */}
          <Card title="Neutral (Slate)" subtitle="Backgrounds / Text HSL">
            <div className="flex flex-col gap-2">
              <div className="h-10 bg-neutral-900 rounded-lg flex items-center justify-center text-white text-xs font-semibold">900 (Dark)</div>
              <div className="h-10 bg-neutral-500 rounded-lg flex items-center justify-center text-white text-xs font-semibold">500 (Gray)</div>
              <div className="h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-800 text-xs font-semibold border border-neutral-200">100 (Light)</div>
            </div>
          </Card>

          {/* Role Badges Accent */}
          <Card title="Role Accents" subtitle="Brand identification">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-role-admin" />
                <span className="text-xs font-semibold text-neutral-700">Admin Accent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-role-faculty" />
                <span className="text-xs font-semibold text-neutral-700">Faculty Accent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-role-student" />
                <span className="text-xs font-semibold text-neutral-700">Student Accent</span>
              </div>
            </div>
          </Card>

          {/* Feedback */}
          <Card title="Status Feedback" subtitle="Notifications / Alerts">
            <div className="flex flex-col gap-2">
              <div className="h-8 bg-success-500/10 text-success-600 rounded border border-success-500/20 flex items-center justify-center text-xs font-semibold">Success</div>
              <div className="h-8 bg-danger-500/10 text-danger-600 rounded border border-danger-500/20 flex items-center justify-center text-xs font-semibold">Danger</div>
              <div className="h-8 bg-warning-500/10 text-warning-600 rounded border border-warning-500/20 flex items-center justify-center text-xs font-semibold">Warning</div>
              <div className="h-8 bg-info-500/10 text-info-600 rounded border border-info-500/20 flex items-center justify-center text-xs font-semibold">Info</div>
            </div>
          </Card>
        </div>
      </section>

      {/* 3. Reusable Components */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold text-neutral-800 mb-6 border-l-4 border-primary-500 pl-3">3. Reusable Components</h2>
        <div className="flex flex-col gap-8">
          
          {/* Buttons */}
          <Card title="Buttons" subtitle="Variants and States">
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="destructive">Destructive Button</Button>
              <Button variant="primary" isLoading={true}>Loading</Button>
              <Button variant="primary" disabled={true}>Disabled</Button>
            </div>
          </Card>

          {/* Form Fields */}
          <Card title="Form Inputs" subtitle="Standard Inputs & Error Configurations">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="First Name"
                placeholder="Enter name..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <Input
                label="Email (Invalid state)"
                placeholder="Enter email..."
                value="invalid-email"
                error={inputError}
                onChange={() => {}}
              />
              <Select
                label="Role Designation"
                options={[
                  { value: 'admin', label: 'Administrator' },
                  { value: 'faculty', label: 'Faculty Staff' },
                  { value: 'student', label: 'Active Student' }
                ]}
                onChange={() => {}}
              />
            </div>
            <div className="mt-4">
              <Textarea label="Bio / Description" placeholder="Tell us about yourself..." onChange={() => {}} />
            </div>
          </Card>

          {/* Badges & Progress */}
          <Card title="Status Badges & Progress Bars" subtitle="Vibrant progress and tracking elements">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-2.5">
                <Badge variant="neutral">Neutral Badge</Badge>
                <Badge variant="primary">Primary Badge</Badge>
                <Badge variant="success">Success Badge</Badge>
                <Badge variant="warning">Warning Badge</Badge>
                <Badge variant="danger">Danger Badge</Badge>
                <Badge variant="info">Info Badge</Badge>
                <Badge variant="roleAdmin">Admin Badge</Badge>
                <Badge variant="roleFaculty">Faculty Badge</Badge>
                <Badge variant="roleStudent">Student Badge</Badge>
              </div>
              <div className="flex flex-col gap-3 max-w-md">
                <span className="text-xs font-semibold text-neutral-500">Progress: 65% completed</span>
                <ProgressBar percentage={65} color="primary" />
                <ProgressBar percentage={35} color="danger" />
              </div>
            </div>
          </Card>

          {/* Modals */}
          <Card title="Modals & Dialogs" subtitle="Overlay Modal dialog animations">
            <div>
              <Button onClick={() => setModalOpen(true)}>Open Modal Dialog</Button>
              <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Configure System Module"
                footer={
                  <>
                    <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={() => setModalOpen(false)}>Save Settings</Button>
                  </>
                }
              >
                <div className="flex gap-3.5 p-1">
                  <div className="p-2.5 rounded-lg bg-info-500/10 flex items-center justify-center flex-shrink-0">
                    <Info className="w-6 h-6 text-info-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-800">Module Update Available</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed mt-1">
                      Are you sure you want to initialize the system update parameters? This configuration affects global API settings.
                    </p>
                  </div>
                </div>
              </Modal>
            </div>
          </Card>

          {/* Data Table */}
          <Card title="Data Tables" subtitle="Advanced client-side sorted and paginated tables">
            <DataTable
              columns={demoColumns}
              data={demoData}
              searchable={true}
              searchKey="name"
              searchPlaceholder="Filter by student name..."
            />
          </Card>

        </div>
      </section>
    </div>
  );
}

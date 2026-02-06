import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { productLinesApi } from '@/api/product-lines';
import { CheckCircle2, Circle } from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Product Details', description: 'Basic information' },
  { id: 2, name: 'System Connections', description: 'Source and target systems' },
  { id: 3, name: 'Template Selection', description: 'Choose a template (optional)' },
  { id: 4, name: 'Workflow Configuration', description: 'Configure workflow steps' },
  { id: 5, name: 'Review & Deploy', description: 'Review and create' },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    productOwner: '',
    technicalLead: '',
    sourceSystem: 'guidewire',
    targetSystem: 'earnix',
    template: '',
    workflowSteps: [
      { id: 'validate', name: 'Input Validation', enabled: true },
      { id: 'transform', name: 'Data Mapping', enabled: true },
      { id: 'rules', name: 'Business Rules', enabled: true },
      { id: 'calculate', name: 'Calculate Premium', enabled: true },
      { id: 'respond', name: 'Format Response', enabled: true },
    ],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => productLinesApi.create(data),
    onSuccess: (data) => {
      navigate(`/product-lines/${data.code}`);
    },
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const config = {
      productLine: {
        code: formData.code,
        name: formData.name,
        displayName: formData.name,
        industry: 'commercial',
        states: [],
      },
      integrations: {
        sourceSystem: {
          type: formData.sourceSystem,
          endpoint: '',
          authentication: 'oauth2',
        },
        targetSystems: [
          {
            type: formData.targetSystem,
            endpoint: '',
            authentication: 'api_key',
          },
        ],
      },
      workflow: {
        steps: formData.workflowSteps.map((step) => ({
          id: step.id,
          type: 'system' as const,
          name: step.name,
          enabled: step.enabled,
        })),
      },
      features: {
        dataMapping: { enabled: true, aiAssisted: true },
        businessRules: { enabled: true, aiGeneration: true },
        multiStateSupport: { enabled: true, states: [] },
      },
      api: {
        baseEndpoint: `/api/v1/rating/${formData.code.toLowerCase()}`,
        methods: ['POST'],
        authentication: 'api_key',
      },
    };

    createMutation.mutate({
      code: formData.code,
      name: formData.name,
      description: formData.description,
      productOwner: formData.productOwner,
      technicalLead: formData.technicalLead,
      status: 'draft',
      config,
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Steps */}
      <nav aria-label="Progress" className="mb-8">
        <ol className="flex items-center">
          {STEPS.map((step, index) => (
            <li
              key={step.id}
              className={`relative ${index !== STEPS.length - 1 ? 'flex-1' : ''}`}
            >
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    step.id < currentStep
                      ? 'bg-primary-600'
                      : step.id === currentStep
                      ? 'bg-primary-600 ring-4 ring-primary-100'
                      : 'bg-gray-200'
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  ) : (
                    <Circle className="h-6 w-6 text-white" />
                  )}
                </div>
                {index !== STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      step.id < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-900">{step.name}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </nav>

      {/* Step Content */}
      <div className="card">
        {currentStep === 1 && (
          <Step1ProductDetails formData={formData} setFormData={setFormData} />
        )}
        {currentStep === 2 && (
          <Step2SystemConnections formData={formData} setFormData={setFormData} />
        )}
        {currentStep === 3 && (
          <Step3TemplateSelection formData={formData} setFormData={setFormData} />
        )}
        {currentStep === 4 && (
          <Step4WorkflowConfig formData={formData} setFormData={setFormData} />
        )}
        {currentStep === 5 && <Step5Review formData={formData} />}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <div className="flex space-x-2">
            <button onClick={() => navigate('/product-lines')} className="btn btn-secondary">
              Cancel
            </button>
            {currentStep < STEPS.length ? (
              <button onClick={handleNext} className="btn btn-primary">
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="btn btn-primary"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Product Line'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step1ProductDetails({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Product Details</h2>
      <p className="text-sm text-gray-600">
        Enter basic information about your product line
      </p>

      <div>
        <label className="label">Product Code</label>
        <input
          type="text"
          className="input"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          placeholder="GL_COMMERCIAL"
        />
        <p className="mt-1 text-xs text-gray-500">Unique identifier for this product line</p>
      </div>

      <div>
        <label className="label">Product Name</label>
        <input
          type="text"
          className="input"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="General Liability Commercial"
        />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description of this product line..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Product Owner</label>
          <input
            type="text"
            className="input"
            value={formData.productOwner}
            onChange={(e) => setFormData({ ...formData, productOwner: e.target.value })}
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="label">Technical Lead</label>
          <input
            type="text"
            className="input"
            value={formData.technicalLead}
            onChange={(e) => setFormData({ ...formData, technicalLead: e.target.value })}
            placeholder="Jane Smith"
          />
        </div>
      </div>
    </div>
  );
}

function Step2SystemConnections({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">System Connections</h2>
      <p className="text-sm text-gray-600">Configure source and target systems</p>

      <div>
        <label className="label">Source System</label>
        <select
          className="input"
          value={formData.sourceSystem}
          onChange={(e) => setFormData({ ...formData, sourceSystem: e.target.value })}
        >
          <option value="guidewire">Guidewire PolicyCenter</option>
          <option value="duck_creek">Duck Creek</option>
          <option value="sapiens">Sapiens</option>
          <option value="custom">Custom System</option>
        </select>
      </div>

      <div>
        <label className="label">Target Rating Engine</label>
        <select
          className="input"
          value={formData.targetSystem}
          onChange={(e) => setFormData({ ...formData, targetSystem: e.target.value })}
        >
          <option value="earnix">Earnix</option>
          <option value="ratabase">Ratabase</option>
          <option value="insurity">Insurity</option>
          <option value="custom">Custom Engine</option>
        </select>
      </div>
    </div>
  );
}

function Step3TemplateSelection({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Template Selection</h2>
      <p className="text-sm text-gray-600">
        Start from a template or build from scratch (optional)
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div
          onClick={() => setFormData({ ...formData, template: '' })}
          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            !formData.template
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <h3 className="font-medium">Start from Scratch</h3>
          <p className="text-sm text-gray-500 mt-1">Build custom configuration</p>
        </div>
        <div
          onClick={() => setFormData({ ...formData, template: 'GL_TEMPLATE' })}
          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            formData.template
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <h3 className="font-medium">GL Commercial Template</h3>
          <p className="text-sm text-gray-500 mt-1">Pre-configured for GL lines</p>
        </div>
      </div>
    </div>
  );
}

function Step4WorkflowConfig({ formData, setFormData }: any) {
  const toggleStep = (id: string) => {
    setFormData({
      ...formData,
      workflowSteps: formData.workflowSteps.map((step: any) =>
        step.id === id ? { ...step, enabled: !step.enabled } : step
      ),
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Workflow Configuration</h2>
      <p className="text-sm text-gray-600">Configure workflow steps</p>

      <div className="space-y-2">
        {formData.workflowSteps.map((step: any) => (
          <div
            key={step.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <h3 className="font-medium">{step.name}</h3>
              <p className="text-sm text-gray-500">{step.id}</p>
            </div>
            <button
              onClick={() => toggleStep(step.id)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                step.enabled
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {step.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step5Review({ formData }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Review & Deploy</h2>
      <p className="text-sm text-gray-600">Review your configuration before creating</p>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-gray-900">Product Line</h3>
          <dl className="mt-2 text-sm">
            <div className="py-1"><span className="text-gray-500">Code:</span> {formData.code}</div>
            <div className="py-1"><span className="text-gray-500">Name:</span> {formData.name}</div>
            <div className="py-1"><span className="text-gray-500">Owner:</span> {formData.productOwner || 'N/A'}</div>
          </dl>
        </div>

        <div>
          <h3 className="font-medium text-gray-900">Systems</h3>
          <dl className="mt-2 text-sm">
            <div className="py-1"><span className="text-gray-500">Source:</span> {formData.sourceSystem}</div>
            <div className="py-1"><span className="text-gray-500">Target:</span> {formData.targetSystem}</div>
          </dl>
        </div>

        <div>
          <h3 className="font-medium text-gray-900">Workflow Steps</h3>
          <div className="mt-2 text-sm">
            {formData.workflowSteps.filter((s: any) => s.enabled).length} of {formData.workflowSteps.length} steps enabled
          </div>
        </div>
      </div>
    </div>
  );
}

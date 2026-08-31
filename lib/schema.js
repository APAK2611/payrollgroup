// Single source of truth for the CRM's controlled vocabularies.
// Mirrors product-plan.md. Used by the contact form and validated
// server-side by the API route.

// contacts.type enum (lowercased) — from product plan Q4.
export const INQUIRY_TYPES = [
  { value: 'membership', label: 'Membership' },
  { value: 'training', label: 'Training' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'general_enquiry', label: 'General enquiry' },
  { value: 'newsletter_signup', label: 'Newsletter signup' },
];

export const INQUIRY_TYPE_VALUES = INQUIRY_TYPES.map((t) => t.value);

// people.attributes jsonb keys — custom attributes from the product plan.
export const CUSTOM_ATTRIBUTES = {
  membership_type: {
    label: 'Membership type',
    kind: 'select',
    options: ['Professional Member', 'Beryl Member', 'Non-Member'],
  },
  organisation_size: {
    label: 'Organisation size',
    kind: 'select',
    options: ['1–50', '51–200', '201–500', '501–1,000', '1,000+'],
  },
  membership_renewal_date: {
    label: 'Membership renewal date',
    kind: 'date',
  },
};

// Contacts pipeline stages (Build 2 uses the transitions; Build 1 lands new_lead).
export const CONTACT_STATUSES = [
  'new_lead',
  'contacted',
  'discovery_call',
  'proposal',
  'won',
  'lost',
];

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface FamilyMember {
  id: string;
  name: string;
}

interface InsuranceProvider {
  id: string;
  name: string;
}

interface PrefillData {
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  phone?: string;
  email?: string;
  insuranceProvider?: string;
  memberID?: string;
  policyNumber?: string;
  preferredLanguage?: string;
  preferredCommunication?: string;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  familyMember?: string;
}

const formSchema = z.object({
  familyMember: z.string().min(1, 'Please select a family member'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  address: z.string().min(1, 'Address is required'),
  insuranceProvider: z.string().min(1, 'Insurance provider is required'),
  reasonForVisit: z.string().min(1, 'Reason for visit is required'),
  onsetDate: z.string().min(1, 'Onset date is required'),
  currentSymptoms: z.array(z.string()).min(1, 'Please select at least one symptom'),
  preferredSpecialties: z.array(z.string()),
  preferredLanguage: z.string(),
  preferredCommunication: z.string().min(1, 'Preferred communication method is required'),
  emergencyContact: z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string(),
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface PatientIntakeFormProps {
  familyMembers: FamilyMember[];
  insuranceProviders: InsuranceProvider[];
  mode: 'profile' | 'dashboard';
  prefilledData?: PrefillData;
  onSubmit: (data: FormValues) => void;
}

export const PatientIntakeForm: React.FC<PatientIntakeFormProps> = ({
  familyMembers,
  insuranceProviders,
  mode,
  prefilledData,
  onSubmit,
}) => {
  const isReadOnly = mode === 'profile';
  const selectedMemberId = prefilledData?.familyMember || familyMembers[0]?.id || '';

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...prefilledData,
      familyMember: selectedMemberId,
      currentSymptoms: [],
      preferredSpecialties: [],
      emergencyContact: prefilledData?.emergencyContact ?? {
        name: '',
        relationship: '',
        phone: ''
      }
    },
  });

  const [selectedMember, setSelectedMember] = useState<string>(selectedMemberId);

  const symptoms = [
    'Pain',
    'Fever',
    'Dizziness',
    'Fatigue',
    'Nausea',
    'Headache',
    'Cough',
    'Shortness of Breath',
    'Rash',
    'Swelling',
  ];

  const specialties = [
    'Primary Care',
    'Orthopedics',
    'Cardiology',
    'Neurology',
    'Dermatology',
    'Oncology',
    'Gastroenterology',
    'Urology',
    'Ophthalmology',
    'ENT',
  ];

  const languages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Chinese',
    'Other',
  ];

  const communicationMethods = [
    'Call',
    'SMS',
    'Email',
  ];

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Patient Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Patient Name</label>
            <select
              className="w-full p-2 border rounded"
              value={selectedMember}
              onChange={(e) => {
                setSelectedMember(e.target.value);
              }}
              disabled={isReadOnly}
            >
              {familyMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date of Birth</label>
            <Controller
              name="dateOfBirth"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <DatePicker
                    {...field}
                    selected={field.value ? new Date(field.value) : null}
                    onChange={(date) => field.onChange(date?.toISOString())}
                    className="w-full p-2 border rounded"
                    disabled={isReadOnly}
                  />
                  {field.value && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                      Age: {calculateAge(field.value)}
                    </span>
                  )}
                </div>
              )}
            />
            {errors.dateOfBirth && (
              <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select
              className="w-full p-2 border rounded"
              {...control._fields.gender}
              disabled={isReadOnly}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && (
              <p className="text-sm text-red-500 mt-1">{errors.gender.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              className="w-full p-2 border rounded h-24"
              {...control._fields.address}
              disabled={isReadOnly}
            />
            {errors.address && (
              <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              className="w-full p-2 border rounded"
              {...control._fields.phone}
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded"
              {...control._fields.email}
              disabled={isReadOnly}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Insurance Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Insurance Provider</label>
            <select
              className="w-full p-2 border rounded"
              {...control._fields.insuranceProvider}
              disabled={isReadOnly}
            >
              <option value="">Select Provider</option>
              {insuranceProviders.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
            {errors.insuranceProvider && (
              <p className="text-sm text-red-500 mt-1">{errors.insuranceProvider.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Member ID</label>
            <input
              className="w-full p-2 border rounded"
              {...control._fields.memberID}
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Policy Number</label>
            <input
              className="w-full p-2 border rounded"
              {...control._fields.policyNumber}
              disabled={isReadOnly}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Medical Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Reason for Visit</label>
            <textarea
              className="w-full p-2 border rounded h-24"
              {...control._fields.reasonForVisit}
              disabled={isReadOnly}
            />
            {errors.reasonForVisit && (
              <p className="text-sm text-red-500 mt-1">{errors.reasonForVisit.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Onset Date</label>
            <Controller
              name="onsetDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  selected={field.value ? new Date(field.value) : null}
                  onChange={(date) => field.onChange(date?.toISOString())}
                  className="w-full p-2 border rounded"
                  disabled={isReadOnly}
                />
              )}
            />
            {errors.onsetDate && (
              <p className="text-sm text-red-500 mt-1">{errors.onsetDate.message}</p>
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Current Symptoms</label>
            <div className="flex flex-wrap gap-2">
              {symptoms.map((symptom) => (
                <Controller
                  key={symptom}
                  name="currentSymptoms"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={field.value.includes(symptom)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            field.onChange([...field.value, symptom]);
                          } else {
                            field.onChange(field.value.filter(s => s !== symptom));
                          }
                        }}
                        disabled={isReadOnly}
                      />
                      <label className="ml-2">{symptom}</label>
                    </div>
                  )}
                />
              ))}
            </div>
            {errors.currentSymptoms && (
              <p className="text-sm text-red-500 mt-1">{errors.currentSymptoms.message}</p>
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Preferred Specialties</label>
            <div className="flex flex-wrap gap-2">
              {specialties.map((specialty) => (
                <Controller
                  key={specialty}
                  name="preferredSpecialties"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={field.value.includes(specialty)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            field.onChange([...field.value, specialty]);
                          } else {
                            field.onChange(field.value.filter(s => s !== specialty));
                          }
                        }}
                        disabled={isReadOnly}
                      />
                      <label className="ml-2">{specialty}</label>
                    </div>
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Preferences</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Preferred Language</label>
            <select
              className="w-full p-2 border rounded"
              {...control._fields.preferredLanguage}
              disabled={isReadOnly}
            >
              <option value="">Select Language</option>
              {languages.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Preferred Communication</label>
            <select
              className="w-full p-2 border rounded"
              {...control._fields.preferredCommunication}
              disabled={isReadOnly}
            >
              <option value="">Select Method</option>
              {communicationMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            {errors.preferredCommunication && (
              <p className="text-sm text-red-500 mt-1">{errors.preferredCommunication.message}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Emergency Contact</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Controller
                name="emergencyContact.name"
                control={control}
                defaultValue=""
                render={({ field: { onChange, onBlur, value } }) => (
                  <input
                    type="text"
                    placeholder="Name"
                    className="w-full p-2 border rounded"
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={isReadOnly}
                  />
                )}
              />
            </div>
            <div>
              <Controller
                name="emergencyContact.relationship"
                control={control}
                defaultValue=""
                render={({ field: { onChange, onBlur, value } }) => (
                  <input
                    type="text"
                    placeholder="Relationship"
                    className="w-full p-2 border rounded"
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={isReadOnly}
                  />
                )}
              />
            </div>
            <div className="col-span-2">
              <Controller
                name="emergencyContact.phone"
                control={control}
                defaultValue=""
                render={({ field: { onChange, onBlur, value } }) => (
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="w-full p-2 border rounded"
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={isReadOnly}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {!isReadOnly && (
        <div className="mt-6">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit
          </button>
        </div>
      )}
    </form>
  );
};

export default PatientIntakeForm;

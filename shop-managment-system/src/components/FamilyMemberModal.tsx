import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { FamilyMember } from '../types/types';
import { X, Users, User, Heart, Baby, UserCheck, MoreHorizontal, Crown } from 'lucide-react';

interface FamilyMemberModalProps {
  member: FamilyMember | null;
  onClose: () => void;
}

type FormData = {
  name: string;
  relation: FamilyMember['relation'];
  isActive: boolean;
};

export function FamilyMemberModal({ member, onClose }: FamilyMemberModalProps) {
  const { familyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember } = useShop();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMembersList, setShowMembersList] = useState(!member);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(member);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    relation: ('self' as FamilyMember['relation']),
    isActive: true,
  });

  const relationOptions: Array<{ value: FormData['relation']; label: string; icon: any }> = [
    { value: 'self', label: 'Self (खुद)', icon: UserCheck },
    { value: 'father', label: 'Father (पिता)', icon: Crown },
    { value: 'mother', label: 'Mother (माता)', icon: Heart },
    { value: 'spouse', label: 'Wife/Husband (पत्नी/पति)', icon: Heart },
    { value: 'brother', label: 'Brother (भाई)', icon: User },
    { value: 'sister', label: 'Sister (बहन)', icon: User },
    { value: 'son', label: 'Son (बेटा)', icon: Baby },
    { value: 'daughter', label: 'Daughter (बेटी)', icon: Baby },
    { value: 'child', label: 'Child (बच्चा)', icon: Baby },
    { value: 'other', label: 'Other (अन्य)', icon: MoreHorizontal },
  ];

  // sync editingMember with incoming prop
  useEffect(() => {
    setEditingMember(member ?? null);
    setShowMembersList(!member);
  }, [member]);

  // populate form when editingMember changes
  useEffect(() => {
    if (editingMember) {
      setFormData({
        name: editingMember.name,
        relation: editingMember.relation,
        isActive: editingMember.isActive,
      });
      setShowMembersList(false);
    } else {
      setFormData({
        name: '',
        relation: 'self',
        isActive: true,
      });
    }
  }, [editingMember]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else {
      // duplicate check (exclude current member when editing)
      const existingMember = familyMembers.find(
        (m) =>
          m.name.toLowerCase() === formData.name.trim().toLowerCase() &&
          m.id !== editingMember?.id
      );
      if (existingMember) newErrors.name = 'A family member with this name already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const memberData = {
        name: formData.name.trim(),
        relation: formData.relation,
        isActive: formData.isActive,
      };

      if (editingMember) {
        await updateFamilyMember(editingMember.id, memberData);
        setEditingMember(null);
        setShowMembersList(true);
      } else {
        await addFamilyMember(memberData);
        setFormData({ name: '', relation: 'self', isActive: true });
      }
    } catch (err) {
      setErrors({ submit: 'Failed to save family member. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (confirm('Are you sure you want to delete this family member? This will not delete their expense records.')) {
      try {
        await deleteFamilyMember(memberId);
      } catch (err) {
        console.error('Error deleting member:', err);
      }
    }
  };

  // strongly-typed change handler
  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) setErrors((prev) => ({ ...prev, [field as string]: '' }));
  };

  const handleEditMember = (memberToEdit: FamilyMember) => {
    setEditingMember(memberToEdit);
  };

  const activeFamilyMembers = familyMembers.filter((m) => m.isActive);
  const inactiveFamilyMembers = familyMembers.filter((m) => !m.isActive);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Family Members</h2>
                <p className="text-purple-100">Manage your family members</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              disabled={isLoading}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {showMembersList ? (
            <div className="space-y-6">
              {/* Add New Member Form */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Family Member</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errors.submit && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg">{errors.submit}</div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Enter name"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                          errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        disabled={isLoading}
                      />
                      {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Relation *</label>
                      <select
                        value={formData.relation}
                        onChange={(e) => handleChange('relation', e.target.value as FormData['relation'])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        disabled={isLoading}
                      >
                        {relationOptions.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Adding...' : 'Add Member'}
                  </button>
                </form>
              </div>

              {/* Active Members List */}
              {activeFamilyMembers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Family Members</h3>
                  <div className="space-y-3">
                    {activeFamilyMembers.map((familyMember) => {
                      const relationOption = relationOptions.find((r) => r.value === familyMember.relation);
                      const Icon = relationOption?.icon || User;

                      return (
                        <div
                          key={familyMember.id}
                          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="bg-purple-100 p-2 rounded-lg">
                              <Icon className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{familyMember.name}</div>
                              <div className="text-sm text-gray-500">{relationOption?.label}</div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditMember(familyMember)}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                              disabled={isLoading}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMember(familyMember.id)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              disabled={isLoading}
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Inactive Members List */}
              {inactiveFamilyMembers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Inactive Members</h3>
                  <div className="space-y-3">
                    {inactiveFamilyMembers.map((familyMember) => {
                      const relationOption = relationOptions.find((r) => r.value === familyMember.relation);
                      const Icon = relationOption?.icon || User;

                      return (
                        <div
                          key={familyMember.id}
                          className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg opacity-60"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="bg-gray-200 p-2 rounded-lg">
                              <Icon className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-700">{familyMember.name}</div>
                              <div className="text-sm text-gray-500">{relationOption?.label} (Inactive)</div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditMember(familyMember)}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                              disabled={isLoading}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMember(familyMember.id)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              disabled={isLoading}
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {familyMembers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No family members added yet. Add your first family member above.</p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">{errors.submit}</div>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingMember ? 'Edit Family Member' : 'Add Family Member'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowMembersList(true);
                    setEditingMember(null);
                  }}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                  disabled={isLoading}
                >
                  ← Back to List
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter name"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relation *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {relationOptions.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleChange('relation', value)}
                      className={`p-3 border rounded-lg text-left transition-colors flex items-center space-x-2 ${
                        formData.relation === value ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      disabled={isLoading}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    disabled={isLoading}
                  />
                  <span className="text-sm font-medium text-gray-700">Active member (can be selected for expenses)</span>
                </label>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowMembersList(true);
                    setEditingMember(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : editingMember ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

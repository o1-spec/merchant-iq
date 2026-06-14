'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Sliders,
  Loader2,
  Check,
  AlertCircle,
  Building,
  MapPin,
  Briefcase,
  DollarSign,
  Bell,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import {
  getMerchantProfile,
  updateMerchantProfile,
  updatePreferences,
  updatePassword,
  type MerchantProfile,
} from '@/lib/profile-client';

type TabType = 'profile' | 'preferences' | 'security';

export default function SettingsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile fields state
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [location, setLocation] = useState('');

  // Preferences fields state
  const [currency, setCurrency] = useState('NGN');
  const [alertThreshold, setAlertThreshold] = useState(10000);
  const [smsNotifications, setSmsNotifications] = useState(false);

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const profile = await getMerchantProfile();
        
        setBusinessName(profile.businessName);
        setBusinessType(profile.businessType);
        setBusinessCategory(profile.businessCategory);
        setLocation(profile.location);
        
        setCurrency(profile.currency || 'NGN');
        setAlertThreshold(profile.alertThreshold !== undefined ? profile.alertThreshold : 10000);
        setSmsNotifications(!!profile.smsNotifications);
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || 'Failed to load merchant settings');
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [toast]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateMerchantProfile({
        businessName,
        businessType,
        businessCategory,
        location,
      });
      toast.success('Business profile updated successfully');
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Failed to update business profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updatePreferences({
        currency,
        alertThreshold: Number(alertThreshold),
        smsNotifications,
      });
      toast.success('Operating preferences updated successfully');
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Failed to update operating preferences');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      setSaving(true);
      await updatePassword({
        currentPassword,
        newPassword,
      });
      toast.success('Account password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm text-slate-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Configure your business profile, operational preferences, and account security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        
        {/* Left Side Tab Navigation */}
        <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible border-b md:border-b-0 md:border-r border-slate-200 pb-2 md:pb-0 md:pr-4 gap-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors text-left w-full ${
              activeTab === 'profile'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            Business Profile
          </button>
          
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors text-left w-full ${
              activeTab === 'preferences'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            Operating Settings
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors text-left w-full ${
              activeTab === 'security'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" />
            Security & Password
          </button>
        </div>

        {/* Right Side Settings Forms */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          
          {/* TAB 1: PROFILE FORM */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" />
                  Business Profile
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage public attributes for your store location.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Business Name</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none transition-colors"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Business Type</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Retail, Wholesaler, Services"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Convenience & Groceries, Clothing"
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lagos, Nigeria"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors shadow-sm"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Profile
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: OPERATING PREFERENCES */}
          {activeTab === 'preferences' && (
            <form onSubmit={handlePreferencesSubmit} className="p-6 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-slate-400" />
                  Operating Preferences
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Configure operational constraints, notifications, and defaults.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      Default Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none transition-colors"
                    >
                      <option value="NGN">NGN (₦) - Nigerian Naira</option>
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="GHS">GHS (₵) - Ghanaian Cedi</option>
                      <option value="KES">KES (KSh) - Kenyan Shilling</option>
                      <option value="ZAR">ZAR (R) - South African Rand</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5" />
                      Low Balance Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={alertThreshold}
                      onChange={(e) => setAlertThreshold(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={smsNotifications}
                      onChange={(e) => setSmsNotifications(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 border-slate-200 focus:ring-emerald-500 mt-1 cursor-pointer shrink-0"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">Automated SMS Reports & Briefs</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Send automated SMS notifications directly to your phone when cashflow is projected to drop below your warning threshold.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors shadow-sm"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Preferences
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SECURITY FORM */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" />
                  Security Settings
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Secure your accounting files and dashboard access.</p>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors shadow-sm"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Change Password
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Building,
  Tag,
  MapPin,
  Save,
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
  Copy,
} from 'lucide-react';
import {
  getMerchantProfile,
  updateMerchantProfile,
  logout,
  type MerchantProfile
} from '@/lib/profile-client';
import { useToast } from '@/components/ui/toast';

function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      
      <div className="space-y-2">
        <div className="h-6 bg-slate-200 rounded w-48" />
        <div className="h-4 bg-slate-100 rounded w-80" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="h-4 bg-slate-200 rounded w-32" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="h-3 bg-slate-100 rounded w-16" />
              <div className="h-9 bg-slate-50 rounded w-full" />
            </div>
            <div className="space-y-1">
              <div className="h-3 bg-slate-100 rounded w-16" />
              <div className="h-9 bg-slate-50 rounded w-full" />
            </div>
          </div>
          <div className="h-9 bg-slate-200 rounded w-28 align-right" />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="h-12 bg-slate-50 rounded w-full" />
          <div className="h-9 bg-slate-100 rounded w-full" />
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passportCopied, setPassportCopied] = useState(false);

  
  const [form, setForm] = useState({
    businessName: '',
    businessType: '',
    businessCategory: '',
    location: '',
  });

  
  const [formErrors, setFormErrors] = useState({
    businessName: '',
    businessType: '',
    businessCategory: '',
    location: '',
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMerchantProfile();
      setProfile(data);
      setForm({
        businessName: data.businessName,
        businessType: data.businessType,
        businessCategory: data.businessCategory,
        location: data.location,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not fetch profile details.';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleFieldChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccessMsg(null);
    setSaveError(null);
    
    
    const label = field === 'businessName' 
      ? 'Business name' 
      : field === 'businessType' 
      ? 'Business type' 
      : field === 'businessCategory' 
      ? 'Business category' 
      : 'Location';

    if (value.trim().length > 0 && value.trim().length < 2) {
      setFormErrors((prev) => ({ ...prev, [field]: `${label} must be at least 2 characters.` }));
    } else {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const errs = {
      businessName: '',
      businessType: '',
      businessCategory: '',
      location: '',
    };
    let isValid = true;
    
    if (!form.businessName.trim() || form.businessName.trim().length < 2) {
      errs.businessName = 'Business name must be at least 2 characters.';
      isValid = false;
    }
    if (!form.businessType.trim() || form.businessType.trim().length < 2) {
      errs.businessType = 'Business type must be at least 2 characters.';
      isValid = false;
    }
    if (!form.businessCategory.trim() || form.businessCategory.trim().length < 2) {
      errs.businessCategory = 'Business category must be at least 2 characters.';
      isValid = false;
    }
    if (!form.location.trim() || form.location.trim().length < 2) {
      errs.location = 'Location must be at least 2 characters.';
      isValid = false;
    }
    
    setFormErrors(errs);
    return isValid;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || saving) return;

    setSaving(true);
    setSuccessMsg(null);
    setSaveError(null);

    try {
      const res = await updateMerchantProfile({
        businessName: form.businessName.trim(),
        businessType: form.businessType.trim(),
        businessCategory: form.businessCategory.trim(),
        location: form.location.trim(),
      });
      
      
      setProfile(res.merchant);
      const msg = 'Profile updated successfully.';
      setSuccessMsg(msg);
      success(msg);
      
      
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      setSaveError(msg);
      toastError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      success('Logged out successfully. Redirecting...');
      router.push('/login');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Logout failed.';
      toastError(msg);
      setLoggingOut(false);
    }
  };

  
  const hasChanged = profile && (
    form.businessName !== profile.businessName ||
    form.businessType !== profile.businessType ||
    form.businessCategory !== profile.businessCategory ||
    form.location !== profile.location
  );

  
  const hasErrors = Object.values(formErrors).some((err) => !!err);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center gap-3">
        <AlertCircle className="w-10 h-10 text-red-500 shrink-0" />
        <h3 className="font-semibold text-slate-900 text-sm">We couldn't load your profile</h3>
        <p className="text-xs text-slate-500 max-w-sm">{error ?? 'Something went wrong.'}</p>
        <button
          onClick={loadProfile}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors mt-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry loading
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Business Profile</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Manage the details MerchantIQ uses to personalize your insights.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        <form onSubmit={handleSave} className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-5">
          <h3 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-emerald-600 shrink-0" />
            Business Details
          </h3>

          
          {successMsg && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-3 py-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          
          {saveError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{saveError}</span>
            </div>
          )}

          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label htmlFor="p-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Business Name
              </label>
              <input
                id="p-name"
                type="text"
                value={form.businessName}
                onChange={(e) => handleFieldChange('businessName', e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-50 transition-shadow"
              />
              {formErrors.businessName && (
                <p className="text-[10px] text-red-600 mt-1 font-medium">{formErrors.businessName}</p>
              )}
            </div>

            
            <div>
              <label htmlFor="p-type" className="block text-xs font-semibold text-slate-700 mb-1">
                Business Type
              </label>
              <input
                id="p-type"
                type="text"
                value={form.businessType}
                onChange={(e) => handleFieldChange('businessType', e.target.value)}
                disabled={saving}
                placeholder="e.g. Sole Proprietorship, Ltd"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-50 transition-shadow"
              />
              {formErrors.businessType && (
                <p className="text-[10px] text-red-600 mt-1 font-medium">{formErrors.businessType}</p>
              )}
            </div>

            
            <div>
              <label htmlFor="p-category" className="block text-xs font-semibold text-slate-700 mb-1">
                Business Category
              </label>
              <input
                id="p-category"
                type="text"
                value={form.businessCategory}
                onChange={(e) => handleFieldChange('businessCategory', e.target.value)}
                disabled={saving}
                placeholder="e.g. Retail, Food & Beverage"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-50 transition-shadow"
              />
              {formErrors.businessCategory && (
                <p className="text-[10px] text-red-600 mt-1 font-medium">{formErrors.businessCategory}</p>
              )}
            </div>

            
            <div>
              <label htmlFor="p-location" className="block text-xs font-semibold text-slate-700 mb-1">
                Location
              </label>
              <input
                id="p-location"
                type="text"
                value={form.location}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                disabled={saving}
                placeholder="e.g. Lagos, Nigeria"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-50 transition-shadow"
              />
              {formErrors.location && (
                <p className="text-[10px] text-red-600 mt-1 font-medium">{formErrors.location}</p>
              )}
            </div>
          </div>

          
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={!hasChanged || hasErrors || saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>

        
        <div className="space-y-6">
          
          {/* Shareable Passport Link Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              Financial Trust Passport
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Generate a shareable public passport certifying your business health score and consistency for lenders. Cash balances and transaction listings are completely masked.
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/public/merchant/${profile.id}`;
                  navigator.clipboard.writeText(url);
                  setPassportCopied(true);
                  setTimeout(() => setPassportCopied(false), 2000);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors"
              >
                {passportCopied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Passport Link Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-emerald-600" />
                    Copy Passport Link
                  </>
                )}
              </button>
              <a
                href={`/public/merchant/${profile.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Trust Passport
              </a>
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600 shrink-0" />
              Account Info
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-2.5">
                <Building className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-400 font-medium">Business Name</p>
                  <p className="text-slate-800 font-semibold mt-0.5">{profile.businessName}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Tag className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-400 font-medium">Category</p>
                  <p className="text-slate-800 font-semibold mt-0.5">{profile.businessCategory}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-400 font-medium">Location</p>
                  <p className="text-slate-800 font-semibold mt-0.5">{profile.location}</p>
                </div>
              </div>
            </div>
          </div>

          
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Session Control</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Sign out of your current session on this device.</p>
            </div>
            
            <button
              onClick={() => setShowLogoutModal(true)}
              disabled={loggingOut}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold border border-red-200 hover:border-red-300 text-red-600 bg-red-50/50 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {loggingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
              ) : (
                <LogOut className="w-3.5 h-3.5 shrink-0" />
              )}
              Log out
            </button>
          </div>

        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-sm animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-900 text-sm">Log out of MerchantIQ?</h3>
                <p className="text-xs text-slate-500 mt-0.5">You will need to sign in again to access your store insights.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowLogoutModal(false);
                  await handleLogout();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

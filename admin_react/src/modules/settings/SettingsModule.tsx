import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, AdminUser } from '../../contexts/AuthContext';
import { useI18n } from '../../lib/i18n';
import { apiFetch } from '../../lib/apiFetch';
import { useToast } from '../../components/Toast';
import { useConfirmDialog } from '../../components/ConfirmDialog';

interface StaffMember {
  id: number;
  username: string;
  email: string;
  full_name: string;
  job_title: string;
  role: string;
  is_active: number | boolean;
  created_at: string;
  updated_at?: string;
}

export function SettingsModule() {
  const { adminUser, updateAdminUser } = useAuth();
  const { lang } = useI18n();
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const [activeTab, setActiveTab] = useState<'profile' | 'staff'>('profile');

  // Profile Form State
  const [fullName, setFullName] = useState(adminUser?.full_name || 'المدير العام');
  const [jobTitle, setJobTitle] = useState(adminUser?.job_title || 'المدير العام');
  const [email, setEmail] = useState(adminUser?.email || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Staff State
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Add/Edit Staff Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [staffFullName, setStaffFullName] = useState('');
  const [staffJobTitle, setStaffJobTitle] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [isSavingStaff, setIsSavingStaff] = useState(false);

  // Sync state if adminUser changes
  useEffect(() => {
    if (adminUser) {
      setFullName(adminUser.full_name || '');
      setJobTitle(adminUser.job_title || '');
      setEmail(adminUser.email || '');
    }
  }, [adminUser]);

  // Fetch Staff List
  const fetchStaff = useCallback(async () => {
    setIsLoadingStaff(true);
    try {
      const res = await apiFetch<StaffMember[]>('get_staff');
      if (res.success && Array.isArray(res.data)) {
        setStaffList(res.data);
      }
    } catch {
      showToast(lang === 'ar' ? 'فشل تحميل بيانات فريق العمل' : 'Failed to load staff list', 'error');
    } finally {
      setIsLoadingStaff(false);
    }
  }, [lang, showToast]);

  useEffect(() => {
    if (activeTab === 'staff') {
      fetchStaff();
    }
  }, [activeTab, fetchStaff]);

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast(lang === 'ar' ? 'الاسم الكامل مطلوب' : 'Full name is required', 'info');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await apiFetch<{ admin: AdminUser }>('update_my_profile', {
        method: 'POST',
        body: {
          full_name: fullName.trim(),
          job_title: jobTitle.trim() || 'مشرف',
          email: email.trim(),
        },
      });

      if (res.success) {
        updateAdminUser({
          full_name: fullName.trim(),
          job_title: jobTitle.trim() || 'مشرف',
          email: email.trim(),
        });
        showToast(lang === 'ar' ? 'تم تحديث الملف الشخصي بنجاح!' : 'Profile updated successfully!', 'success');
      } else {
        showToast(res.error || (lang === 'ar' ? 'فشل تحديث الملف الشخصي' : 'Update failed'), 'error');
      }
    } catch {
      showToast(lang === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection error', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Change Password Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast(lang === 'ar' ? 'يرجى إدخال كلمة المرور الحالية' : 'Enter current password', 'info');
      return;
    }
    if (newPassword.length < 6) {
      showToast(lang === 'ar' ? 'كلمة المرور الجديدة يجب ألا تقل عن 6 خانات' : 'Password must be at least 6 characters', 'info');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(lang === 'ar' ? 'كلمة المرور وتأكيدها غير متطابقين' : 'Passwords do not match', 'error');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await apiFetch('change_my_password', {
        method: 'POST',
        body: {
          current_password: currentPassword,
          new_password: newPassword,
        },
      });

      if (res.success) {
        showToast(lang === 'ar' ? 'تم تغيير كلمة المرور بنجاح! 🔒' : 'Password changed successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(res.error || (lang === 'ar' ? 'فشل تغيير كلمة المرور' : 'Password change failed'), 'error');
      }
    } catch {
      showToast(lang === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection error', 'error');
    } finally {
      setIsChangingPass(false);
    }
  };

  // Open Add Staff Modal
  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingStaffId(null);
    setStaffFullName('');
    setStaffJobTitle('خدمة العملاء والدعم');
    setStaffUsername('');
    setStaffEmail('');
    setStaffPassword('');
    setIsModalOpen(true);
  };

  // Open Edit Staff Modal
  const handleOpenEditModal = (member: StaffMember) => {
    setModalMode('edit');
    setEditingStaffId(member.id);
    setStaffFullName(member.full_name || '');
    setStaffJobTitle(member.job_title || '');
    setStaffUsername(member.username || '');
    setStaffEmail(member.email || '');
    setStaffPassword(''); // empty unless changing
    setIsModalOpen(true);
  };

  // Save Staff (Add or Edit)
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFullName.trim() || !staffUsername.trim()) {
      showToast(lang === 'ar' ? 'الاسم الكامل واسم المستخدم مطلوبان' : 'Full name and username required', 'info');
      return;
    }

    if (modalMode === 'add' && (!staffPassword || staffPassword.length < 6)) {
      showToast(lang === 'ar' ? 'كلمة المرور يجب ألا تقل عن 6 خانات' : 'Password must be at least 6 characters', 'info');
      return;
    }

    setIsSavingStaff(true);
    try {
      if (modalMode === 'add') {
        const res = await apiFetch('create_staff', {
          method: 'POST',
          body: {
            full_name: staffFullName.trim(),
            job_title: staffJobTitle.trim() || 'مشرف',
            username: staffUsername.trim(),
            email: staffEmail.trim(),
            password: staffPassword,
          },
        });

        if (res.success) {
          showToast(lang === 'ar' ? 'تم إضافة الموظف بنجاح! 🎉' : 'Staff added successfully!', 'success');
          setIsModalOpen(false);
          fetchStaff();
        } else {
          showToast(res.error || (lang === 'ar' ? 'فشل إضافة الموظف' : 'Failed to add staff'), 'error');
        }
      } else {
        const res = await apiFetch('update_staff', {
          method: 'POST',
          body: {
            id: editingStaffId,
            full_name: staffFullName.trim(),
            job_title: staffJobTitle.trim() || 'مشرف',
            email: staffEmail.trim(),
            password: staffPassword.trim() || undefined,
          },
        });

        if (res.success) {
          showToast(lang === 'ar' ? 'تم تحديث بيانات الموظف بنجاح!' : 'Staff updated successfully!', 'success');
          setIsModalOpen(false);
          fetchStaff();
        } else {
          showToast(res.error || (lang === 'ar' ? 'فشل التحديث' : 'Update failed'), 'error');
        }
      }
    } catch {
      showToast(lang === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection error', 'error');
    } finally {
      setIsSavingStaff(false);
    }
  };

  // Toggle Staff Active/Inactive Status
  const handleToggleStatus = async (member: StaffMember) => {
    const newStatus = Number(member.is_active) === 1 ? 0 : 1;
    const actionName = newStatus === 1 
      ? (lang === 'ar' ? 'تفعيل' : 'activate') 
      : (lang === 'ar' ? 'تعطيل' : 'deactivate');

    const confirmed = await confirm({
      title: lang === 'ar' ? `${actionName} حساب ${member.full_name}` : `${actionName} account of ${member.full_name}`,
      message: lang === 'ar'
        ? `هل أنت متأكد من رغبتك في ${actionName} حساب (${member.username})؟ ${newStatus === 0 ? 'لن يتمكن من تسجيل الدخول للوحة التحكم.' : ''}`
        : `Are you sure you want to ${actionName} account (${member.username})?`,
      confirmText: lang === 'ar' ? 'نعم، تابع' : 'Yes, proceed',
      variant: newStatus === 0 ? 'danger' : 'primary',
    });

    if (!confirmed) return;

    try {
      const res = await apiFetch('toggle_staff_status', {
        method: 'POST',
        body: { id: member.id, is_active: newStatus },
      });

      if (res.success) {
        showToast(lang === 'ar' ? `تم ${actionName} الحساب بنجاح` : `Account ${actionName}d successfully`, 'success');
        fetchStaff();
      } else {
        showToast(res.error || (lang === 'ar' ? 'فشل تعديل الحالة' : 'Status update failed'), 'error');
      }
    } catch {
      showToast(lang === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection error', 'error');
    }
  };

  // Delete Staff Account
  const handleDeleteStaff = async (member: StaffMember) => {
    if (member.id === 1) {
      showToast(lang === 'ar' ? 'لا يمكن حذف حساب المدير العام الرئيسي' : 'Cannot delete Super Admin', 'info');
      return;
    }

    const confirmed = await confirm({
      title: lang === 'ar' ? `حذف حساب الموظف ${member.full_name}` : `Delete staff ${member.full_name}`,
      message: lang === 'ar'
        ? `هل أنت متأكد من حذف حساب (${member.username}) نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`
        : `Are you sure you want to permanently delete account (${member.username})?`,
      confirmText: lang === 'ar' ? 'نعم، احذف الحساب' : 'Yes, delete',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await apiFetch('delete_staff', {
        method: 'POST',
        body: { id: member.id },
      });

      if (res.success) {
        showToast(lang === 'ar' ? 'تم حذف الحساب بنجاح' : 'Staff deleted successfully', 'success');
        fetchStaff();
      } else {
        showToast(res.error || (lang === 'ar' ? 'فشل حذف الحساب' : 'Delete failed'), 'error');
      }
    } catch {
      showToast(lang === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection error', 'error');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Header & Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-gear" style={{ color: 'var(--primary)' }}></i>
            <span>{lang === 'ar' ? 'إعدادات الحساب وفريق العمل' : 'Account & Staff Settings'}</span>
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            {lang === 'ar' ? 'إدارة ملفك الشخصي، تغيير كلمة المرور، وإنشاء حسابات المشرفين والموظفين' : 'Manage your profile, change password, and manage staff accounts'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.88rem',
              background: activeTab === 'profile' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'profile' ? '#ffffff' : 'var(--text-main)',
              transition: 'all 0.2s ease',
            }}
          >
            <i className="fa-solid fa-user-shield"></i>
            <span>{lang === 'ar' ? 'حسابي والأمان' : 'My Profile & Security'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.88rem',
              background: activeTab === 'staff' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'staff' ? '#ffffff' : 'var(--text-main)',
              transition: 'all 0.2s ease',
            }}
          >
            <i className="fa-solid fa-users-gear"></i>
            <span>{lang === 'ar' ? 'فريق العمل والموظفين' : 'Staff & Team'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Profile & Security */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Card 1: My Profile Info */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-id-badge" style={{ color: 'var(--primary)' }}></i>
              <span>{lang === 'ar' ? 'البيانات الشخصية والمسمى الوظيفي' : 'Profile Information'}</span>
            </h2>

            <form onSubmit={handleSaveProfile}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'الاسم الكامل (يظهر في الشريط العلوي)' : 'Full Name (shown in top bar)'}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثلاً: محمد وليد' : 'e.g. Mohamed Waleed'}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'المسمى الوظيفي' : 'Job Title / Role'}
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثلاً: المدير العام / خدمة العملاء' : 'e.g. General Manager / Support'}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@absher.ge"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px var(--primary-glow)',
                }}
              >
                {isSavingProfile ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check"></i>}
                <span>{lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
              </button>
            </form>
          </div>

          {/* Card 2: Change Password */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-key" style={{ color: '#f59e0b' }}></i>
              <span>{lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</span>
            </h2>

            <form onSubmit={handleChangePassword}>
              {/* Current Password */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      fontSize: '0.92rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    style={{
                      position: 'absolute',
                      left: lang === 'ar' ? '12px' : 'auto',
                      right: lang === 'ar' ? 'auto' : '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    <i className={`fa-solid ${showCurrentPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'كلمة المرور الجديدة (6 خانات على الأقل)' : 'New Password (min 6 chars)'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      fontSize: '0.92rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{
                      position: 'absolute',
                      left: lang === 'ar' ? '12px' : 'auto',
                      right: lang === 'ar' ? 'auto' : '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    <i className={`fa-solid ${showNewPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      fontSize: '0.92rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{
                      position: 'absolute',
                      left: lang === 'ar' ? '12px' : 'auto',
                      right: lang === 'ar' ? 'auto' : '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    <i className={`fa-solid ${showConfirmPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isChangingPass}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f59e0b',
                  color: '#0f172a',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: isChangingPass ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                }}
              >
                {isChangingPass ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-lock"></i>}
                <span>{lang === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Staff & Team Management */}
      {activeTab === 'staff' && (
        <div>
          {/* Action & Stats Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ background: 'var(--bg-card)', padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                <span>{lang === 'ar' ? 'إجمالي فريق العمل: ' : 'Total Staff: '}</span>
                <strong style={{ color: 'var(--primary)' }}>{staffList.length}</strong>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                <span>{lang === 'ar' ? 'الحسابات النشطة: ' : 'Active Accounts: '}</span>
                <strong style={{ color: '#10b981' }}>{staffList.filter((s) => Number(s.is_active) === 1).length}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px var(--primary-glow)',
              }}
            >
              <i className="fa-solid fa-user-plus"></i>
              <span>{lang === 'ar' ? '+ إضافة موظف جديد' : '+ Add New Staff'}</span>
            </button>
          </div>

          {/* Staff Table */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            {isLoadingStaff ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.8rem', color: 'var(--primary)', marginBottom: '12px' }}></i>
                <p style={{ margin: 0 }}>{lang === 'ar' ? 'جاري تحميل قائمة الموظفين...' : 'Loading staff...'}</p>
              </div>
            ) : staffList.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-users-slash" style={{ fontSize: '2.5rem', opacity: 0.4, marginBottom: '12px' }}></i>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{lang === 'ar' ? 'لا يوجد موظفين مسجلين حالياً' : 'No staff members found'}</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '14px 18px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>{lang === 'ar' ? 'الموظف والمسمى' : 'Staff & Role'}</th>
                      <th style={{ padding: '14px 18px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>{lang === 'ar' ? 'اسم الدخول (Username)' : 'Username'}</th>
                      <th style={{ padding: '14px 18px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                      <th style={{ padding: '14px 18px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                      <th style={{ padding: '14px 18px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((member) => {
                      const isActive = Number(member.is_active) === 1;
                      const isMainAdmin = member.id === 1;

                      return (
                        <tr
                          key={member.id}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  background: isMainAdmin ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'linear-gradient(135deg, #10b981, #059669)',
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.9rem',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                }}
                              >
                                {member.full_name ? member.full_name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                                  {member.full_name || 'موظف'}
                                  {isMainAdmin && (
                                    <span style={{ marginInlineStart: '6px', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontWeight: 800 }}>
                                      {lang === 'ar' ? 'الرئيسي' : 'Primary'}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  {member.job_title || (isMainAdmin ? 'المدير العام' : 'مشرف')}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '14px 18px', color: 'var(--text-main)', fontSize: '0.88rem', fontWeight: 600 }}>
                            <code>{member.username}</code>
                          </td>

                          <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                            {member.email || '-'}
                          </td>

                          <td style={{ padding: '14px 18px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                color: isActive ? '#10b981' : '#ef4444',
                                border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? '#10b981' : '#ef4444' }}></span>
                              <span>{isActive ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'معطل' : 'Disabled')}</span>
                            </span>
                          </td>

                          <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(member)}
                                title={lang === 'ar' ? 'تعديل البيانات' : 'Edit'}
                                style={{
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-main)',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <i className="fa-solid fa-pen-to-square" style={{ fontSize: '0.8rem' }}></i>
                              </button>

                              {/* Toggle Status Button (Not for main Super Admin) */}
                              {!isMainAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(member)}
                                  title={isActive ? (lang === 'ar' ? 'تعطيل الحساب' : 'Deactivate') : (lang === 'ar' ? 'تفعيل الحساب' : 'Activate')}
                                  style={{
                                    background: isActive ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    border: `1px solid ${isActive ? '#f59e0b' : '#10b981'}`,
                                    color: isActive ? '#f59e0b' : '#10b981',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <i className={`fa-solid ${isActive ? 'fa-user-slash' : 'fa-user-check'}`} style={{ fontSize: '0.8rem' }}></i>
                                </button>
                              )}

                              {/* Delete Button (Not for main Super Admin) */}
                              {!isMainAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStaff(member)}
                                  title={lang === 'ar' ? 'حذف الحساب' : 'Delete'}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid #ef4444',
                                    color: '#ef4444',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <i className="fa-solid fa-trash" style={{ fontSize: '0.8rem' }}></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Staff Member */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className={`fa-solid ${modalMode === 'add' ? 'fa-user-plus' : 'fa-pen-to-square'}`} style={{ color: 'var(--primary)' }}></i>
                <span>{modalMode === 'add' ? (lang === 'ar' ? 'إضافة موظف جديد' : 'Add New Staff') : (lang === 'ar' ? 'تعديل بيانات الموظف' : 'Edit Staff Member')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveStaff} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'الاسم الكامل' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  value={staffFullName}
                  onChange={(e) => setStaffFullName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثلاً: أحمد محمود' : 'e.g. Ahmed Mahmoud'}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}
                </label>
                <input
                  type="text"
                  value={staffJobTitle}
                  onChange={(e) => setStaffJobTitle(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثلاً: خدمة العملاء وشات الطلاب' : 'e.g. Support & Chat'}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'اسم المستخدم للدخول (Username)' : 'Username'} *
                </label>
                <input
                  type="text"
                  value={staffUsername}
                  onChange={(e) => setStaffUsername(e.target.value)}
                  placeholder="ahmed_support"
                  required
                  disabled={modalMode === 'edit'}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: modalMode === 'edit' ? 'rgba(255, 255, 255, 0.05)' : 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    cursor: modalMode === 'edit' ? 'not-allowed' : 'text',
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'البريد الإلكتروني (اختياري)' : 'Email (optional)'}
                </label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="staff@absher.ge"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {modalMode === 'add' 
                    ? (lang === 'ar' ? 'كلمة المرور الأولية للدخول *' : 'Initial Password *') 
                    : (lang === 'ar' ? 'تعيين كلمة مرور جديدة للموظف (اتركها فارغة إن لم ترغب بتغييرها)' : 'Set new password (leave empty to keep current)')}
                </label>
                <input
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder={modalMode === 'add' ? '******' : (lang === 'ar' ? 'اتركه فارغاً للاحتفاظ بكلمة المرور الحالية' : 'Leave empty to keep')}
                  required={modalMode === 'add'}
                  minLength={modalMode === 'add' ? 6 : undefined}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingStaff}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: isSavingStaff ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px var(--primary-glow)',
                  }}
                >
                  {isSavingStaff ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check"></i>}
                  <span>{modalMode === 'add' ? (lang === 'ar' ? 'إضافة الحساب' : 'Create Account') : (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

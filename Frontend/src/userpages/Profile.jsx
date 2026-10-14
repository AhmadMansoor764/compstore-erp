import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Store as StoreIcon,
  Trash2,
  UserRound,
  Wallet,
  X,
} from "lucide-react";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const Profile = () => {
  const fileInputRef = useRef(null);
  const profileImageUrlRef = useRef("");

  const [profileImage, setProfileImage] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [depositAmount, setDepositAmount] = useState("");
  const [depositDescription, setDepositDescription] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "Store Owner",
    location: "",
    bio: "",
  });

  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [emailData, setEmailData] = useState({
    newEmail: "",
    password: "",
  });

  const [store, setStore] = useState(null);
  const [storeLoadError, setStoreLoadError] = useState("");
  const [isStoreLoading, setIsStoreLoading] = useState(true);
  const [isSavingStore, setIsSavingStore] = useState(false);

  const [isCreateStoreModalOpen, setIsCreateStoreModalOpen] = useState(false);

  const [storeForm, setStoreForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    balance: "0",
  });

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        setIsProfileLoading(true);

        const response = await fetch(`${API_URL}/auth/profile`, {
          method: "GET",
          credentials: "include",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Could not load your profile.");
        }

        const user = result.user;

        if (!user) {
          throw new Error("The server did not return your profile.");
        }

        const nameParts = (user.name || "").trim().split(/\s+/);

        if (!cancelled) {
          setProfile((previous) => ({
            ...previous,
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" "),
            email: user.email || "",
            phone: user.phone || "",
            role: user.role || "owner",
          }));
        }
      } catch (error) {
        console.error("Load profile error:", error);
        if (!cancelled) {
          toast.error(error.message || "Could not load your profile.");
        }
      } finally {
        if (!cancelled) setIsProfileLoading(false);
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load the store belonging to the currently authenticated member.
  useEffect(() => {
    let cancelled = false;

    const loadStore = async () => {
      try {
        setIsStoreLoading(true);
        setStoreLoadError("");

        const response = await fetch(`${API_URL}/stores/me`, {
          method: "GET",
          credentials: "include",
        });

        const contentType = response.headers.get("content-type");
        const result = contentType?.includes("application/json")
          ? await response.json()
          : await response.text();

        if (!response.ok) {
          throw new Error(
            typeof result === "string"
              ? result
              : result?.message || "Could not load store information.",
          );
        }

        // The backend successfully confirms that this account has no store.
        if (result && typeof result === "object" && result.hasStore === false) {
          if (!cancelled) {
            setStore(null);
            setStoreForm({
              name: "",
              email: "",
              phone: "",
              address: "",
              balance: "",
            });
          }
          return;
        }

        // Handle the normal response when a store exists.
        const loadedStore = result?.store || result?.data;

        if (!loadedStore || !loadedStore.id) {
          throw new Error("The server response did not contain a valid store.");
        }

        if (cancelled) return;

        setStore(loadedStore);

        setStoreForm({
          name: loadedStore.name || "",
          email: loadedStore.email || "",
          phone: loadedStore.phone || "",
          address: loadedStore.address || "",
          balance: "",
        });
      } catch (error) {
        if (cancelled) return;

        console.error("Load store error:", error);
        setStoreLoadError(error.message || "Could not load store information.");
        toast.error(error.message || "Could not load store information.");
      } finally {
        if (!cancelled) {
          setIsStoreLoading(false);
        }
      }
    };

    loadStore();

    return () => {
      cancelled = true;
    };
  }, []);

  // Release the temporary image URL when the component unmounts.
  useEffect(() => {
    return () => {
      if (profileImageUrlRef.current) {
        URL.revokeObjectURL(profileImageUrlRef.current);
      }
    };
  }, []);

  const handleStoreFormChange = (event) => {
    const { name, value } = event.target;

    setStoreForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleStoreSubmit = async (event) => {
    event.preventDefault();

    if (!storeForm.name.trim()) {
      toast.error("Store name is required.");
      return;
    }

    try {
      setIsSavingStore(true);

      const response = await fetch(`${API_URL}/stores`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: storeForm.name.trim(),
          email: storeForm.email.trim().toLowerCase(),
          phone: storeForm.phone.trim(),
          address: storeForm.address.trim(),
          balance: storeForm.balance === "" ? "0" : storeForm.balance,
        }),
      });

      const contentType = response.headers.get("content-type");
      const result = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new Error(
          typeof result === "string"
            ? result
            : result?.message || "Could not create your store.",
        );
      }

      const savedStore = result?.store || result?.data || result;

      if (!savedStore || !savedStore.id) {
        throw new Error(
          "The server response did not contain the created store. Check your backend response.",
        );
      }

      setStore(savedStore);
      setIsCreateStoreModalOpen(false);

      setStoreForm({
        name: savedStore.name || storeForm.name.trim(),
        email: savedStore.email || storeForm.email.trim().toLowerCase(),
        phone: savedStore.phone || storeForm.phone.trim(),
        address: savedStore.address || storeForm.address.trim(),
        balance: savedStore.balance || storeForm.balance,
      });

      setStoreLoadError("");
      toast.success(result?.message || "Store created successfully.");
    } catch (error) {
      console.error("Create store error:", error);
      toast.error(error.message || "Could not create your store.");
    } finally {
      setIsSavingStore(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();

    const amount = Number(depositAmount);

    if (!store?.id) {
      toast.error("Please create a store first.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid deposit amount.");
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(depositAmount.trim())) {
      toast.error("Use no more than two decimal places.");
      return;
    }

    setIsDepositing(true);

    try {
      const response = await fetch(`${API_URL}/stores/${store.id}/deposits`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: depositAmount.trim(),
          description: depositDescription.trim() || "Store deposit",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to record deposit.");
      }

      setStore(result.store);
      setDepositAmount("");
      setDepositDescription("");
      toast.success("Deposit recorded successfully.");
    } catch (error) {
      toast.error(error.message || "Something went wrong.");
    } finally {
      setIsDepositing(false);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB.");
      event.target.value = "";
      return;
    }

    if (profileImageUrlRef.current) {
      URL.revokeObjectURL(profileImageUrlRef.current);
    }

    const imageUrl = URL.createObjectURL(file);

    profileImageUrlRef.current = imageUrl;
    setProfileImage(imageUrl);

    toast.success("Profile image selected.");
  };

  const removeProfileImage = () => {
    if (profileImageUrlRef.current) {
      URL.revokeObjectURL(profileImageUrlRef.current);
      profileImageUrlRef.current = "";
    }

    setProfileImage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    toast.success("Profile image removed.");
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEmailChange = (event) => {
    const { name, value } = event.target;

    setEmailData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    const fullName =
      `${profile.firstName.trim()} ${profile.lastName.trim()}`.trim();

    if (!fullName || !profile.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }

    try {
      setIsSavingProfile(true);

      const response = await fetch(`${API_URL}/auth/profile`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName,
          email: profile.email.trim().toLowerCase(),
          phone: profile.phone.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not save your profile.");
      }

      const user = result.user;

      if (user) {
        const nameParts = (user.name || "").trim().split(/\s+/);

        setProfile((previous) => ({
          ...previous,
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" "),
          email: user.email || "",
          phone: user.phone || "",
          role: user.role || previous.role,
        }));
      }

      toast.success(result.message || "Profile updated successfully.");
    } catch (error) {
      console.error("Save profile error:", error);
      toast.error(error.message || "Could not save your profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (isChangingPassword) return;

    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error("Please complete all password fields.");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("New password must contain at least 8 characters.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error("Your new password must differ from your current password.");
      return;
    }

    try {
      setIsChangingPassword(true);

      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordData),
      });

      const contentType = response.headers.get("content-type");

      const result = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new Error(
          typeof result === "string"
            ? result
            : result?.message || "Could not change your password.",
        );
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      toast.success(result.message || "Password changed successfully.");
    } catch (error) {
      console.error("Change password error:", error);
      toast.error(error.message || "Could not change your password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleEmailSubmit = (event) => {
    event.preventDefault();

    if (!emailData.newEmail.trim() || !emailData.password) {
      toast.error("Please complete all email fields.");
      return;
    }

    // No backend email-change endpoint is connected yet.
    toast("Email changing is not connected to the backend yet.");
  };

  const getInitials = () => {
    const first = profile.firstName?.charAt(0) || "";
    const last = profile.lastName?.charAt(0) || "";

    return `${first}${last}`.toUpperCase() || "U";
  };

  const inputClassName =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

  const labelClassName = "mb-2 block text-sm font-medium text-slate-700";

  const sectionClassName =
    "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
        >
          <div>
            <Link
              to="/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
            >
              <ArrowLeft size={17} />
              Back to dashboard
            </Link>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Profile Settings
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your owner profile, security, and account preferences.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={17} />
            Account active
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          {/* Left profile column */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-fit space-y-6"
          >
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="h-28 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500" />

              <div className="-mt-14 px-6 pb-6">
                <div className="relative mx-auto h-28 w-28">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-indigo-100 text-3xl font-bold text-indigo-700 shadow-lg">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Owner profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials()
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-indigo-600 text-white shadow-md transition hover:bg-indigo-700"
                    aria-label="Upload profile image"
                  >
                    <Camera size={16} />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    aria-label="Choose profile image"
                  />
                </div>

                <div className="mt-4 text-center">
                  <h2 className="text-xl font-bold text-slate-900">
                    {profile.firstName} {profile.lastName}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">{profile.role}</p>

                  <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500">
                    <MapPin size={16} />
                    {profile.location}
                  </div>
                </div>

                <Link to="/dashboard/suppliers">supplier</Link>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    Upload image
                  </button>

                  <button
                    type="button"
                    onClick={removeProfileImage}
                    disabled={!profileImage}
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>

                <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                  JPG, PNG or WEBP. Maximum file size: 5MB.
                </p>
              </div>
            </div>

            {/* Account summary */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900">Account overview</h3>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                      <ShieldCheck size={18} />
                    </div>
                    <span className="text-sm text-slate-600">
                      Account security
                    </span>
                  </div>

                  <span className="text-sm font-semibold text-emerald-600">
                    Good
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                      <Wallet size={18} />
                    </div>
                    <span className="text-sm text-slate-600">Account type</span>
                  </div>

                  <span className="text-sm font-semibold text-slate-900">
                    Owner
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                      <Clock3 size={18} />
                    </div>
                    <span className="text-sm text-slate-600">Last login</span>
                  </div>

                  <span className="text-sm font-semibold text-slate-900">
                    Today
                  </span>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Right content column */}
          <main className="space-y-6">
            {/* Personal information */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className={sectionClassName}
            >
              <div className="mb-6 flex items-start gap-3">
                <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                  <UserRound size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Personal information
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Update the information displayed on your owner profile.
                  </p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit}>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClassName} htmlFor="firstName">
                      First name *
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      value={profile.firstName}
                      onChange={handleProfileChange}
                      className={inputClassName}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClassName} htmlFor="lastName">
                      Last name *
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      value={profile.lastName}
                      onChange={handleProfileChange}
                      className={inputClassName}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClassName} htmlFor="profilePhone">
                      Phone number *
                    </label>
                    <div className="relative">
                      <Phone
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="profilePhone"
                        type="tel"
                        name="phone"
                        value={profile.phone}
                        onChange={handleProfileChange}
                        className={`${inputClassName} pl-11`}
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClassName} htmlFor="profileLocation">
                      Location *
                    </label>
                    <div className="relative">
                      <MapPin
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="profileLocation"
                        type="text"
                        name="location"
                        value={profile.location}
                        onChange={handleProfileChange}
                        className={`${inputClassName} pl-11`}
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClassName} htmlFor="profileBio">
                      Short bio
                    </label>
                    <textarea
                      id="profileBio"
                      name="bio"
                      value={profile.bio}
                      onChange={handleProfileChange}
                      rows={4}
                      className={`${inputClassName} resize-none`}
                      placeholder="Write a short description about yourself..."
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    <Save size={17} />
                    {isSavingProfile ? "Saving..." : "Save profile"}
                  </button>
                </div>
              </form>
            </motion.section>

            {/* Store information */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className={sectionClassName}
            >
              <div className="mb-6 flex items-start gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                  <StoreIcon size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Store information
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Create your store or review the store connected to your
                    account.
                  </p>
                </div>
              </div>

              {isStoreLoading ? (
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                  Loading store information...
                </div>
              ) : storeLoadError ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-800">{storeLoadError}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-3 text-sm font-semibold text-amber-900 underline"
                  >
                    Retry
                  </button>
                </div>
              ) : store ? (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        Your store
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-slate-900">
                        {store.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        This store is linked to your signed-in account.
                      </p>
                    </div>

                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 size={15} />
                      Store created
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-8 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Store email
                        </p>
                        <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                          {store.email || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Store phone
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {store.phone || "Not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col-reverse gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-green-100 p-2">
                            <Wallet className="h-5 w-5 text-green-600" />
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">
                              Store Balance
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              ${Number(store.balance ?? 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Store address
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {store.address || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <form
                      onSubmit={handleDeposit}
                      className="mt-5 space-y-4 rounded-xl border border-gray-200 p-4"
                    >
                      <h3 className="text-base font-semibold text-gray-900">
                        Add Money to Store
                      </h3>

                      <div>
                        <label
                          htmlFor="deposit-amount"
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          Deposit Amount
                        </label>

                        <input
                          id="deposit-amount"
                          type="number"
                          min="0.01"
                          step="0.01"
                          required
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="100.00"
                          className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="deposit-description"
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          Description (optional)
                        </label>

                        <input
                          id="deposit-description"
                          type="text"
                          maxLength={255}
                          value={depositDescription}
                          onChange={(e) =>
                            setDepositDescription(e.target.value)
                          }
                          placeholder="Cash added by owner"
                          className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isDepositing}
                        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDepositing ? "Recording Deposit..." : "Add Deposit"}
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <StoreIcon size={26} />
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    No store created yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Create your store to start managing products, stock,
                    purchases, and sales.
                  </p>

                  <button
                    type="button"
                    onClick={() => setIsCreateStoreModalOpen(true)}
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    <StoreIcon size={17} />
                    Create Store
                  </button>
                </div>
              )}
            </motion.section>

            {/* Email section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={sectionClassName}
            >
              <div className="mb-6 flex items-start gap-3">
                <div className="rounded-2xl bg-sky-50 p-3 text-sky-600">
                  <Mail size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Email address
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Your email is used for login, verification, and account
                    recovery.
                  </p>
                </div>
              </div>

              <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Current email
                    </p>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                      {profile.email}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <Check size={14} />
                    Verified
                  </span>
                </div>
              </div>

              <form onSubmit={handleEmailSubmit}>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClassName} htmlFor="newEmail">
                      New email address *
                    </label>
                    <input
                      id="newEmail"
                      type="email"
                      name="newEmail"
                      value={emailData.newEmail}
                      onChange={handleEmailChange}
                      className={inputClassName}
                      placeholder="newemail@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClassName} htmlFor="emailPassword">
                      Current password *
                    </label>
                    <input
                      id="emailPassword"
                      type="password"
                      name="password"
                      value={emailData.password}
                      onChange={handleEmailChange}
                      className={inputClassName}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                  <p>
                    Changing your email will require a backend endpoint and
                    verification flow before the new address becomes active.
                  </p>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Mail size={17} />
                    Change email
                  </button>
                </div>
              </form>
            </motion.section>

            {/* Change password */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={sectionClassName}
            >
              <div className="mb-6 flex items-start gap-3">
                <div className="rounded-2xl bg-violet-50 p-3 text-violet-600">
                  <LockKeyhole size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Change password
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Use a strong password to protect your store account.
                  </p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit}>
                <div className="space-y-5">
                  <div>
                    <label className={labelClassName} htmlFor="currentPassword">
                      Current password *
                    </label>

                    <div className="relative">
                      <input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className={`${inputClassName} pr-12`}
                        placeholder="Enter current password"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword((previous) => !previous)
                        }
                        aria-label={
                          showCurrentPassword
                            ? "Hide current password"
                            : "Show current password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        {showCurrentPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className={labelClassName} htmlFor="newPassword">
                        New password *
                      </label>

                      <div className="relative">
                        <input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className={`${inputClassName} pr-12`}
                          placeholder="Minimum 8 characters"
                          required
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowNewPassword((previous) => !previous)
                          }
                          aria-label={
                            showNewPassword
                              ? "Hide new password"
                              : "Show new password"
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          {showNewPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        className={labelClassName}
                        htmlFor="confirmPassword"
                      >
                        Confirm new password *
                      </label>

                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className={`${inputClassName} pr-12`}
                          placeholder="Repeat new password"
                          required
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((previous) => !previous)
                          }
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirmation password"
                              : "Show confirmation password"
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">
                    Password requirements
                  </p>

                  <ul className="mt-2 space-y-1 text-sm text-slate-500">
                    <li>• At least 8 characters</li>
                    <li>• Use uppercase and lowercase letters</li>
                    <li>• Include at least one number or symbol</li>
                  </ul>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LockKeyhole size={17} />
                    {isChangingPassword
                      ? "Updating password..."
                      : "Update password"}
                  </button>
                </div>
              </form>
            </motion.section>

            {/* Security settings */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={sectionClassName}
            >
              <div className="mb-6 flex items-start gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                  <ShieldCheck size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Security settings
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Add extra protection to your owner account.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                <div className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
                  <div className="flex gap-3">
                    <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                      <ShieldCheck size={19} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Two-factor authentication
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Require an additional verification code when logging in.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={twoFactorEnabled}
                    aria-label="Toggle two-factor authentication"
                    onClick={() => {
                      setTwoFactorEnabled((previous) => !previous);
                      toast(
                        "Two-factor authentication is a visual demo and is not connected to the backend.",
                      );
                    }}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                      twoFactorEnabled ? "bg-indigo-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                        twoFactorEnabled ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
                  <div className="flex gap-3">
                    <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                      <FileText size={19} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Login activity
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Review recent devices and login sessions.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      toast(
                        "Login activity is not connected to the backend yet.",
                      )
                    }
                    className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    View activity
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            </motion.section>

            {/* Danger zone */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-3xl border border-red-200 bg-red-50/60 p-5 sm:p-7"
            >
              <div className="mb-5 flex items-start gap-3">
                <div className="rounded-2xl bg-red-100 p-3 text-red-600">
                  <Trash2 size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-red-900">
                    Danger zone
                  </h2>
                  <p className="mt-1 text-sm text-red-700">
                    These actions may affect your account and store data.
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-red-200 bg-white p-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Deactivate account
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Temporarily disable your owner account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    toast("Account deactivation is not connected yet.")
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <X size={16} />
                  Deactivate
                </button>
              </div>
            </motion.section>
          </main>
        </div>
      </div>
      {isCreateStoreModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSavingStore) {
              setIsCreateStoreModalOpen(false);
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="my-auto w-full max-w-xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-store-title"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                  <StoreIcon size={22} />
                </div>

                <div>
                  <h2
                    id="create-store-title"
                    className="text-xl font-bold text-slate-900"
                  >
                    Create your store
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter your business information to get started.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateStoreModalOpen(false)}
                disabled={isSavingStore}
                aria-label="Close create store dialog"
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStoreSubmit} className="space-y-5">
              <div>
                <label className={labelClassName} htmlFor="storeName">
                  Store name *
                </label>
                <input
                  id="storeName"
                  name="name"
                  type="text"
                  value={storeForm.name}
                  onChange={handleStoreFormChange}
                  className={inputClassName}
                  placeholder="e.g. CompStore"
                  required
                />
              </div>
              <div>
                <label className={labelClassName} htmlFor="storeEmail">
                  Store email
                </label>
                <input
                  id="storeEmail"
                  name="email"
                  type="email"
                  value={storeForm.email}
                  onChange={handleStoreFormChange}
                  className={inputClassName}
                  placeholder="store@example.com"
                />
              </div>
              <div>
                <label className={labelClassName} htmlFor="storePhone">
                  Store phone
                </label>
                <input
                  id="storePhone"
                  name="phone"
                  type="tel"
                  value={storeForm.phone}
                  onChange={handleStoreFormChange}
                  className={inputClassName}
                  placeholder="Enter store phone number"
                />
              </div>
              <div>
                <label className={labelClassName} htmlFor="storeAddress">
                  Store address
                </label>
                <input
                  id="storeAddress"
                  name="address"
                  type="text"
                  value={storeForm.address}
                  onChange={handleStoreFormChange}
                  className={inputClassName}
                  placeholder="City, area, street"
                />
              </div>

              <div>
                <label
                  htmlFor="store-balance"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Starting Balance
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>

                  <input
                    id="store-balance"
                    type="number"
                    min="0"
                    step="0.01"
                    value={storeForm.balance}
                    onChange={(e) =>
                      setStoreForm((prev) => ({
                        ...prev,
                        balance: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 py-3 pl-8 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  Enter the money currently available in your store.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreateStoreModalOpen(false)}
                  disabled={isSavingStore}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingStore}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingStore ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creating store...
                    </>
                  ) : (
                    <>
                      <StoreIcon size={17} />
                      Create Store
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Profile;

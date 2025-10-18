import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Calendar, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileData {
  name: string;
  email: string;
  joinedDate: string;
  bio: string;
  avatar?: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "User",
    email: "user@example.com",
    joinedDate: "October 2025",
    bio: "Journaling my way to personal growth with AI assistance.",
  });
  const [editedData, setEditedData] = useState<ProfileData>(profileData);

  useEffect(() => {
    // TODO: Fetch user profile data from your backend
    const fetchProfile = async () => {
      try {
        // const response = await fetch('your-api-endpoint/profile', {
        //   headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
        // });
        // const data = await response.json();
        // setProfileData(data);
        // setEditedData(data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      // TODO: Save profile data to your backend
      // await fetch('your-api-endpoint/profile', {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      //   },
      //   body: JSON.stringify(editedData)
      // });
      setProfileData(editedData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  const handleCancel = () => {
    setEditedData(profileData);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 font-['Inter',sans-serif] overflow-hidden">
      {/* Animated background gradients */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#016BFF] rounded-full filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4BBEBB] rounded-full filter blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
        <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border-b border-gray-800/50 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB]">
              Profile
            </h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Profile Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>

          <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Header Card */}
            <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#016BFF] to-[#4BBEBB] flex items-center justify-center">
                    <User className="w-12 h-12 text-white" />
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#4BBEBB] flex items-center justify-center hover:bg-[#016BFF] transition-colors">
                      <Edit2 className="w-4 h-4 text-black" />
                    </button>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.name}
                      onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                      className="text-3xl font-bold bg-transparent border-b-2 border-[#4BBEBB]/50 text-white focus:outline-none focus:border-[#4BBEBB] mb-2"
                    />
                  ) : (
                    <h2 className="text-3xl font-bold text-white mb-2">{profileData.name}</h2>
                  )}
                  <div className="flex flex-col md:flex-row items-center gap-4 text-gray-400 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#4BBEBB]" />
                      <span>{profileData.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#4BBEBB]" />
                      <span>Joined {profileData.joinedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Edit/Save Buttons */}
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleSave}
                        className="bg-gradient-to-r from-[#4BBEBB] to-[#016BFF] hover:opacity-90 text-black font-semibold px-6 py-2 rounded-xl transition-all flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="border-2 border-gray-700 hover:bg-gray-800/50 text-gray-300 px-6 py-2 rounded-xl transition-all flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-gray-800/60 hover:bg-gray-700/60 text-white px-6 py-2 rounded-xl transition-all flex items-center gap-2 border border-gray-700/50"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Bio Section */}
            <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-[#016BFF] to-[#4BBEBB] rounded-full"></span>
                About
              </h3>
              {isEditing ? (
                <textarea
                  value={editedData.bio}
                  onChange={(e) => setEditedData({ ...editedData, bio: e.target.value })}
                  rows={4}
                  className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4BBEBB]/50 resize-none"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-400 leading-relaxed">
                  {profileData.bio || "No bio added yet."}
                </p>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] mb-2">
                  0
                </div>
                <div className="text-gray-400 text-sm">Journal Entries</div>
              </div>
              <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4BBEBB] to-[#016BFF] mb-2">
                  0
                </div>
                <div className="text-gray-400 text-sm">Goals Set</div>
              </div>
              <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#016BFF] to-[#4BBEBB] mb-2">
                  0
                </div>
                <div className="text-gray-400 text-sm">Calendar Events</div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-[#016BFF] to-[#4BBEBB] rounded-full"></span>
                Account Settings
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-800/50 transition-all group">
                  <span className="text-gray-300 group-hover:text-white">Change Password</span>
                  <Edit2 className="w-4 h-4 text-gray-500 group-hover:text-[#4BBEBB]" />
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-800/50 transition-all group">
                  <span className="text-gray-300 group-hover:text-white">Email Preferences</span>
                  <Edit2 className="w-4 h-4 text-gray-500 group-hover:text-[#4BBEBB]" />
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-red-900/30 transition-all group border border-transparent hover:border-red-500/30">
                  <span className="text-gray-300 group-hover:text-red-400">Delete Account</span>
                  <X className="w-4 h-4 text-gray-500 group-hover:text-red-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { MemberProfile } from '../types';
import SectionHeading from '../components/SectionHeading';
import { Search, Mail, Phone, User, Shield } from 'lucide-react';

const DirectoryPage: React.FC = () => {
  const { user, needsPasswordReset } = useAuth();
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const data = await api.getAllMembers();
        setMembers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, []);

  if (!user) {
    return <Navigate to="/login\" replace />;
  }
  
  // Redirect to password reset if needed
  if (needsPasswordReset) {
    return <Navigate to="/password-reset" replace />;
  }

  const filteredMembers = members.filter(member =>
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.position && member.position.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen pb-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeading
          title="Member Directory"
          subtitle="Connect with your fellow Lodge members"
        />

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <div className="mb-8 relative">
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-neutral-300 rounded-md focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
          </div>

          {loading ? (
            <p className="text-center">Loading...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMembers.map(member => (
                <div key={member.id} className="bg-white rounded-lg p-6 shadow-soft border border-neutral-100 hover:shadow-medium transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                        <User className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-primary-600 text-lg">
                          {member.full_name}
                        </h3>
                        {member.position && (
                          <p className="text-neutral-600 text-sm mt-1">{member.position}</p>
                        )}
                      </div>
                    </div>
                    
                    {member.role === 'admin' && (
                      <div className="flex items-center text-xs font-medium bg-secondary-100 text-secondary-700 px-2 py-1 rounded-full">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-neutral-500">
                      <span>Member since {new Date(member.join_date).getFullYear()}</span>
                    </div>
                    
                    {/* Contact Information - Only show if member has opted to share */}
                    {member.share_contact_info && (member.contact_email || member.contact_phone) && (
                      <div className="pt-3 border-t border-neutral-100">
                        <h4 className="text-sm font-medium text-neutral-700 mb-2">Contact Information</h4>
                        <div className="space-y-2">
                          {member.contact_email && (
                            <div className="flex items-center text-sm">
                              <Mail className="w-4 h-4 text-secondary-500 mr-2 flex-shrink-0" />
                              <a 
                                href={`mailto:${member.contact_email}`}
                                className="text-secondary-600 hover:text-secondary-700 transition-colors truncate"
                                title={member.contact_email}
                              >
                                {member.contact_email}
                              </a>
                            </div>
                          )}
                          
                          {member.contact_phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="w-4 h-4 text-secondary-500 mr-2 flex-shrink-0" />
                              <a 
                                href={`tel:${member.contact_phone.replace(/\s+/g, '')}`}
                                className="text-secondary-600 hover:text-secondary-700 transition-colors"
                              >
                                {member.contact_phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Privacy Notice for members who haven't shared contact info */}
                    {!member.share_contact_info && (
                      <div className="pt-3 border-t border-neutral-100">
                        <p className="text-xs text-neutral-400 italic">
                          Contact information not shared
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectoryPage;
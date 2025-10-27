import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 60px);
  background: ${props => props.theme.colors.background};
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: ${props => props.theme.typography.sizes['3xl']};
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.bold};
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.typography.sizes.base};
`;

const SearchBar = styled.input`
  width: 100%;
  max-width: 500px;
  padding: 0.875rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.base};
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  margin-bottom: 2rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primaryLight};
  }
`;

const Table = styled.table`
  width: 100%;
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.radius.xl};
  overflow: hidden;
  box-shadow: ${props => props.theme.shadows.md};
  border-collapse: collapse;
`;

const Thead = styled.thead`
  background: ${props => props.theme.colors.backgroundSecondary};
`;

const Th = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.typography.sizes.sm};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid ${props => props.theme.colors.border};
`;

const Tbody = styled.tbody``;

const Tr = styled.tr`
  border-bottom: 1px solid ${props => props.theme.colors.border};
  transition: background ${props => props.theme.transitions.fast};

  &:hover {
    background: ${props => props.theme.colors.backgroundSecondary};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const Td = styled.td`
  padding: 1rem;
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.typography.sizes.sm};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background: ${props => props.theme.colors.backgroundSecondary};
`;

const AvatarFallback = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${props => props.theme.typography.weights.semibold};
  font-size: ${props => props.theme.typography.sizes.sm};
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.div`
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text};
`;

const UserEmail = styled.div`
  font-size: ${props => props.theme.typography.sizes.xs};
  color: ${props => props.theme.colors.textSecondary};
`;

const Badge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: ${props => props.theme.radius.sm};
  font-size: ${props => props.theme.typography.sizes.xs};
  font-weight: ${props => props.theme.typography.weights.semibold};
  text-transform: uppercase;
  background: ${props => {
    if (props.$variant === 'admin') return props.theme.colors.error;
    if (props.$variant === 'seller') return props.theme.colors.success;
    if (props.$variant === 'staff') return '#3498db';
    if (props.$variant === 'deactivated') return props.theme.colors.textTertiary;
    return props.theme.colors.primary;
  }};
  color: white;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
`;

const ManageButton = styled.button`
  padding: 0.5rem 1rem;
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.semibold};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    background: ${props => props.theme.colors.primaryHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
`;

const PageButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.medium};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primary};
    color: white;
    border-color: ${props => props.theme.colors.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.typography.sizes.sm};
`;

// Modal Styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.radius.xl};
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  box-shadow: ${props => props.theme.shadows.xl};
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const ModalTitle = styled.h2`
  font-size: ${props => props.theme.typography.sizes.xl};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
  transition: color ${props => props.theme.transitions.fast};

  &:hover {
    color: ${props => props.theme.colors.text};
  }
`;

const ModalBody = styled.div`
  margin-bottom: 1.5rem;
`;

const UserInfoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${props => props.theme.colors.backgroundSecondary};
  border-radius: ${props => props.theme.radius.md};
  margin-bottom: 1.5rem;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid ${props => props.$checked ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  background: ${props => props.$checked ? props.theme.colors.primaryLight : props.theme.colors.surface};

  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: ${props => props.theme.colors.primary};
`;

const CheckboxContent = styled.div`
  flex: 1;
`;

const CheckboxTitle = styled.div`
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text};
  margin-bottom: 0.25rem;
`;

const CheckboxDescription = styled.div`
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.textSecondary};
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.base};
  font-weight: ${props => props.theme.typography.weights.semibold};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  ${props => props.$variant === 'primary' ? `
    background: ${props.theme.colors.primary};
    color: white;

    &:hover:not(:disabled) {
      background: ${props.theme.colors.primaryHover};
    }
  ` : `
    background: ${props.theme.colors.backgroundSecondary};
    color: ${props.theme.colors.text};

    &:hover:not(:disabled) {
      background: ${props.theme.colors.backgroundTertiary};
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const WarningMessage = styled.div`
  padding: 1rem;
  background: ${props => props.theme.colors.warning}20;
  border: 1px solid ${props => props.theme.colors.warning};
  border-radius: ${props => props.theme.radius.md};
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.typography.sizes.sm};
  margin-bottom: 1rem;
`;

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [updatingRoles, setUpdatingRoles] = useState(false);

  // Modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalRoles, setModalRoles] = useState({
    is_admin: false,
    is_seller: false,
    is_staff: false
  });

  const limit = 50;

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const offset = (page - 1) * limit;
      const response = await adminAPI.getAllUsers({ limit, offset, search });
      setUsers(response.data.users);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setModalRoles({
      is_admin: Boolean(user.is_admin),
      is_seller: Boolean(user.is_seller),
      is_staff: Boolean(user.is_staff)
    });
  };

  const closeRoleModal = () => {
    setSelectedUser(null);
    setModalRoles({
      is_admin: false,
      is_seller: false,
      is_staff: false
    });
  };

  const handleRoleToggle = (role) => {
    setModalRoles(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;

    // Prevent admin from removing their own admin role
    if (selectedUser.user_id === currentUser.user_id && !modalRoles.is_admin && Boolean(selectedUser.is_admin)) {
      toast.error('You cannot remove your own admin role');
      return;
    }

    setUpdatingRoles(true);

    try {
      await adminAPI.updateUserRoles(selectedUser.user_id, modalRoles);

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.user_id === selectedUser.user_id
            ? {
                ...user,
                is_admin: modalRoles.is_admin ? 1 : 0,
                is_staff: modalRoles.is_staff ? 1 : 0,
                is_seller: modalRoles.is_seller ? 1 : 0
              }
            : user
        )
      );

      toast.success('Roles updated successfully');
      closeRoleModal();
    } catch (error) {
      console.error('Failed to update roles:', error);
      toast.error(error.response?.data?.message || 'Failed to update roles');
    } finally {
      setUpdatingRoles(false);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const isSelfEdit = selectedUser && selectedUser.user_id === currentUser.user_id;

  return (
    <Container>
      <Header>
        <Title>User Management</Title>
        <Subtitle>View and manage all users in the system</Subtitle>
      </Header>

      <form onSubmit={handleSearch}>
        <SearchBar
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      {loading ? (
        <LoadingState>Loading users...</LoadingState>
      ) : users.length === 0 ? (
        <EmptyState>No users found</EmptyState>
      ) : (
        <>
          <Table>
            <Thead>
              <tr>
                <Th>User</Th>
                <Th>Current Roles</Th>
                <Th>Manage Roles</Th>
                <Th>Purchases</Th>
                <Th>Uploads</Th>
                <Th>Total Spent</Th>
                <Th>Joined</Th>
              </tr>
            </Thead>
            <Tbody>
              {users.map(user => (
                <Tr key={user.user_id}>
                  <Td>
                    <UserInfo>
                      {user.avatar_url ? (
                        <Avatar src={user.avatar_url} alt={user.name} />
                      ) : (
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      )}
                      <UserDetails>
                        <UserName>{user.name}</UserName>
                        <UserEmail>{user.email}</UserEmail>
                      </UserDetails>
                    </UserInfo>
                  </Td>
                  <Td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {Boolean(user.is_admin) && <Badge $variant="admin">Admin</Badge>}
                      {Boolean(user.is_staff) && <Badge $variant="staff">Staff</Badge>}
                      {Boolean(user.is_seller) && <Badge $variant="seller">Seller</Badge>}
                      {Boolean(user.is_deactivated) && <Badge $variant="deactivated">Deactivated</Badge>}
                      {!Boolean(user.is_admin) && !Boolean(user.is_staff) && !Boolean(user.is_seller) && !Boolean(user.is_deactivated) && (
                        <Badge $variant="user">User</Badge>
                      )}
                    </div>
                  </Td>
                  <Td>
                    {!user.is_deactivated ? (
                      <ManageButton onClick={() => openRoleModal(user)}>
                        Edit Roles
                      </ManageButton>
                    ) : (
                      <span style={{ color: '#999', fontSize: '0.875rem' }}>Deactivated</span>
                    )}
                  </Td>
                  <Td>{user.total_purchases || 0}</Td>
                  <Td>{user.total_uploads || 0}</Td>
                  <Td>{parseFloat(user.total_spent || 0).toFixed(2)} ฿</Td>
                  <Td>{new Date(user.created_at).toLocaleDateString()}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          {totalPages > 1 && (
            <Pagination>
              <PageButton
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </PageButton>
              <PageInfo>
                Page {page} of {totalPages} ({total} users)
              </PageInfo>
              <PageButton
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </PageButton>
            </Pagination>
          )}
        </>
      )}

      {/* Role Management Modal */}
      {selectedUser && (
        <ModalOverlay onClick={closeRoleModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Manage User Roles</ModalTitle>
              <CloseButton onClick={closeRoleModal}>×</CloseButton>
            </ModalHeader>

            <ModalBody>
              <UserInfoSection>
                {selectedUser.avatar_url ? (
                  <Avatar src={selectedUser.avatar_url} alt={selectedUser.name} />
                ) : (
                  <AvatarFallback>{getInitials(selectedUser.name)}</AvatarFallback>
                )}
                <UserDetails>
                  <UserName>{selectedUser.name}</UserName>
                  <UserEmail>{selectedUser.email}</UserEmail>
                </UserDetails>
              </UserInfoSection>

              {isSelfEdit && (
                <WarningMessage>
                  You are editing your own roles. Be careful not to remove your admin access!
                </WarningMessage>
              )}

              <CheckboxGroup>
                <CheckboxLabel $checked={modalRoles.is_admin}>
                  <Checkbox
                    type="checkbox"
                    checked={modalRoles.is_admin}
                    onChange={() => handleRoleToggle('is_admin')}
                  />
                  <CheckboxContent>
                    <CheckboxTitle>Admin</CheckboxTitle>
                    <CheckboxDescription>
                      Full system access including user management, all approvals, and analytics
                    </CheckboxDescription>
                  </CheckboxContent>
                </CheckboxLabel>

                <CheckboxLabel $checked={modalRoles.is_staff}>
                  <Checkbox
                    type="checkbox"
                    checked={modalRoles.is_staff}
                    onChange={() => handleRoleToggle('is_staff')}
                  />
                  <CheckboxContent>
                    <CheckboxTitle>Staff</CheckboxTitle>
                    <CheckboxDescription>
                      Can manage payment approvals, cheat sheet approvals, and seller applications
                    </CheckboxDescription>
                  </CheckboxContent>
                </CheckboxLabel>

                <CheckboxLabel $checked={modalRoles.is_seller}>
                  <Checkbox
                    type="checkbox"
                    checked={modalRoles.is_seller}
                    onChange={() => handleRoleToggle('is_seller')}
                  />
                  <CheckboxContent>
                    <CheckboxTitle>Seller</CheckboxTitle>
                    <CheckboxDescription>
                      Can upload and sell cheat sheets on the marketplace
                    </CheckboxDescription>
                  </CheckboxContent>
                </CheckboxLabel>
              </CheckboxGroup>
            </ModalBody>

            <ModalFooter>
              <Button onClick={closeRoleModal}>
                Cancel
              </Button>
              <Button
                $variant="primary"
                onClick={handleSaveRoles}
                disabled={updatingRoles}
              >
                {updatingRoles ? 'Saving...' : 'Save Changes'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default UserManagement;

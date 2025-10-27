import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { adminAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: ${props => props.theme.typography.sizes['3xl']};
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.bold};
`;

const BackLink = styled(Link)`
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  font-weight: ${props => props.theme.typography.weights.semibold};

  &:hover {
    text-decoration: underline;
  }
`;

const FilterSection = styled.div`
  background: ${props => props.theme.colors.surface};
  padding: 1.5rem;
  border-radius: ${props => props.theme.radius.lg};
  box-shadow: ${props => props.theme.shadows.sm};
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.textSecondary};
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.base};
  min-width: 250px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.base};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const TableContainer = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.radius.lg};
  box-shadow: ${props => props.theme.shadows.md};
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead {
    background: ${props => props.theme.colors.backgroundSecondary};
  }

  th {
    text-align: left;
    padding: 1rem;
    font-weight: ${props => props.theme.typography.weights.semibold};
    color: ${props => props.theme.colors.text};
    font-size: ${props => props.theme.typography.sizes.sm};
    border-bottom: 2px solid ${props => props.theme.colors.border};
  }

  td {
    padding: 1rem;
    border-bottom: 1px solid ${props => props.theme.colors.borderLight};
    color: ${props => props.theme.colors.textSecondary};
    font-size: ${props => props.theme.typography.sizes.sm};
  }

  tbody tr {
    transition: background ${props => props.theme.transitions.fast};

    &:hover {
      background: ${props => props.theme.colors.backgroundTertiary};
    }
  }
`;

const CheatSheetTitle = styled(Link)`
  color: ${props => props.theme.colors.text};
  text-decoration: none;
  font-weight: ${props => props.theme.typography.weights.medium};

  &:hover {
    color: ${props => props.theme.colors.primary};
    text-decoration: underline;
  }
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  cursor: pointer;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${props => props.$checked ? props.theme.colors.success : props.theme.colors.textTertiary};
    transition: 0.3s;
    border-radius: 24px;

    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
      transform: ${props => props.$checked ? 'translateX(26px)' : 'translateX(0)'};
    }
  }

  &:hover span {
    box-shadow: 0 0 1px ${props => props.theme.colors.primary};
  }
`;

const Badge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: ${props => props.theme.radius.full};
  font-size: ${props => props.theme.typography.sizes.xs};
  font-weight: ${props => props.theme.typography.weights.semibold};
  background: ${props => {
    switch(props.$status) {
      case 'approved': return props.theme.colors.success;
      case 'pending': return props.theme.colors.warning;
      case 'rejected': return props.theme.colors.error;
      default: return props.theme.colors.textTertiary;
    }
  }};
  color: white;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${props => props.theme.colors.textTertiary};
  font-size: ${props => props.theme.typography.sizes.lg};
`;

const Stats = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.textSecondary};

  span {
    font-weight: ${props => props.theme.typography.weights.semibold};
  }
`;

function AllCheatSheets() {
  const [cheatSheets, setCheatSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchCheatSheets();
  }, []);

  const fetchCheatSheets = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllCheatSheets();
      setCheatSheets(response.data.cheat_sheets || []);
    } catch (error) {
      console.error('Failed to fetch cheat sheets:', error);
      toast.error('Failed to load cheat sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (cheatsheetId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await adminAPI.updateCheatSheetStatus(cheatsheetId, newStatus);

      // Update local state
      setCheatSheets(prev => prev.map(cs =>
        cs.cheatsheet_id === cheatsheetId
          ? { ...cs, is_active: newStatus }
          : cs
      ));

      toast.success(`Cheat sheet ${newStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Failed to toggle status:', error);
      toast.error('Failed to update status');
    }
  };

  const filteredCheatSheets = cheatSheets.filter(cs => {
    const matchesSearch = cs.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cs.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cs.creator_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || cs.approval_status === statusFilter;
    const matchesActive = activeFilter === 'all' ||
                         (activeFilter === 'active' && cs.is_active) ||
                         (activeFilter === 'inactive' && !cs.is_active);

    return matchesSearch && matchesStatus && matchesActive;
  });

  const stats = {
    total: cheatSheets.length,
    active: cheatSheets.filter(cs => cs.is_active).length,
    inactive: cheatSheets.filter(cs => !cs.is_active).length,
    approved: cheatSheets.filter(cs => cs.approval_status === 'approved').length,
    pending: cheatSheets.filter(cs => cs.approval_status === 'pending').length,
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div>
          <Title>All Cheat Sheets</Title>
          <Stats>
            <div>Total: <span>{stats.total}</span></div>
            <div>Active: <span>{stats.active}</span></div>
            <div>Inactive: <span>{stats.inactive}</span></div>
            <div>Approved: <span>{stats.approved}</span></div>
            <div>Pending: <span>{stats.pending}</span></div>
          </Stats>
        </div>
        <BackLink to="/admin">← Back to Dashboard</BackLink>
      </Header>

      <FilterSection>
        <FilterGroup>
          <Label>Search</Label>
          <Input
            type="text"
            placeholder="Search by title, course code, or creator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </FilterGroup>

        <FilterGroup>
          <Label>Approval Status</Label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </Select>
        </FilterGroup>

        <FilterGroup>
          <Label>Active Status</Label>
          <Select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </FilterGroup>
      </FilterSection>

      <TableContainer>
        <Table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Course Code</th>
              <th>Creator</th>
              <th>Price</th>
              <th>Purchases</th>
              <th>Status</th>
              <th>Active</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredCheatSheets.length === 0 ? (
              <tr>
                <td colSpan="9">
                  <EmptyState>
                    {searchTerm || statusFilter !== 'all' || activeFilter !== 'all'
                      ? 'No cheat sheets match your filters'
                      : 'No cheat sheets found'}
                  </EmptyState>
                </td>
              </tr>
            ) : (
              filteredCheatSheets.map(cs => (
                <tr key={cs.cheatsheet_id}>
                  <td>{cs.cheatsheet_id}</td>
                  <td>
                    <CheatSheetTitle to={`/cheatsheet/${cs.cheatsheet_id}`}>
                      {cs.title}
                    </CheatSheetTitle>
                  </td>
                  <td>{cs.course_code}</td>
                  <td>{cs.creator_name || 'Unknown'}</td>
                  <td>{parseFloat(cs.price).toFixed(2)} ฿</td>
                  <td>{cs.purchase_count || 0}</td>
                  <td>
                    <Badge $status={cs.approval_status}>
                      {cs.approval_status}
                    </Badge>
                  </td>
                  <td>
                    <ToggleSwitch $checked={cs.is_active}>
                      <input
                        type="checkbox"
                        checked={cs.is_active}
                        onChange={() => handleToggleActive(cs.cheatsheet_id, cs.is_active)}
                      />
                      <span />
                    </ToggleSwitch>
                  </td>
                  <td>
                    {new Date(cs.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default AllCheatSheets;

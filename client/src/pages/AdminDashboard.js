import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { adminAPI, sellerApplicationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #333;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: ${props => props.theme.shadows.md};
  text-align: center;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: all 0.3s;
  text-decoration: none;
  display: block;
  color: inherit;

  &:hover {
    ${props => props.$clickable && `
      transform: translateY(-2px);
      box-shadow: ${props.theme.shadows.lg};
    `}
  }

  h3 {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
  }

  p {
    font-size: 2rem;
    font-weight: bold;
    color: #131D4F;
  }
`;

const Section = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: ${props => props.theme.shadows.md};
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #333;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    text-align: left;
    padding: 1rem;
    background: #f8f8f8;
    font-weight: 600;
    color: #333;
  }

  td {
    padding: 1rem;
    border-top: 1px solid #eee;
  }
`;

const Badge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => {
    switch(props.status) {
      case 'paid': return '#4ade80';
      case 'pending': return '#fbbf24';
      case 'failed': return '#f87171';
      case 'open': return '#3498db';
      case 'resolved': return '#2ecc71';
      case 'closed': return '#95a5a6';
      default: return '#ddd';
    }
  }};
  color: white;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
`;

const FilterLabel = styled.label`
  font-weight: 600;
  color: #666;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 2px solid #ddd;
  border-radius: 5px;
  font-size: 0.9rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #131D4F;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  background: ${props => props.variant === 'approve' ? '#4ade80' : props.variant === 'reject' ? '#f87171' : '#131D4F'};
  color: white;

  &:hover {
    opacity: 0.8;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
`;

const MessageCell = styled.div`
  max-width: 300px;
  cursor: pointer;

  .message-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: ${props => props.expanded ? 'normal' : 'nowrap'};
    word-break: break-word;
  }

  .expand-hint {
    font-size: 0.75rem;
    color: #131D4F;
    margin-top: 0.25rem;
    font-weight: 600;
  }

  &:hover .expand-hint {
    text-decoration: underline;
  }
`;

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [ticketFilter, setTicketFilter] = useState('open');
  const [loading, setLoading] = useState(true);
  const [expandedTickets, setExpandedTickets] = useState(new Set());
  const [version, setVersion] = useState(null);
  const [pendingSellerApps, setPendingSellerApps] = useState(0);
  const [pendingCheatsheets, setPendingCheatsheets] = useState(0);

  useEffect(() => {
    // Scroll to top when component mounts or route changes
    window.scrollTo(0, 0);
    fetchData();
    fetchVersion();
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchTickets();
    }
  }, [ticketFilter, isAdmin]);

  const fetchData = async () => {
    try {
      // Staff can access pending payments, but only admins can see full stats
      const promises = [adminAPI.getPendingPayments()];

      // Only fetch stats if user is admin
      if (isAdmin) {
        promises.unshift(adminAPI.getStats());
      }

      const results = await Promise.all(promises);

      // If admin, first result is stats, second is payments
      // If staff, first result is payments
      if (isAdmin) {
        const [statsRes, paymentsRes] = results;
        setStats(statsRes.data);
        setPendingPayments(paymentsRes.data.payments);
      } else {
        const [paymentsRes] = results;
        setPendingPayments(paymentsRes.data.payments);
        // Set minimal stats for staff (only what they need)
        setStats({
          total_cheatsheets: 0,
          pending_purchases: paymentsRes.data.payments.length
        });
      }

      // Fetch seller applications separately to avoid breaking the entire page if it fails
      try {
        const sellerAppsRes = await sellerApplicationAPI.getAll({ status: 'pending' });
        setPendingSellerApps(sellerAppsRes.data.applications.length);
      } catch (sellerError) {
        console.error('Failed to fetch seller applications:', sellerError);
        // Don't show error toast, just set to 0
        setPendingSellerApps(0);
      }

      // Fetch pending cheat sheets separately
      try {
        const cheatsheetsRes = await adminAPI.getPendingCheatsheets();
        setPendingCheatsheets(cheatsheetsRes.data.count);

        // For staff, also update total_cheatsheets count from this response
        if (!isAdmin && cheatsheetsRes.data.totalCheatsheets) {
          setStats(prevStats => ({
            ...prevStats,
            total_cheatsheets: cheatsheetsRes.data.totalCheatsheets
          }));
        }
      } catch (cheatsheetError) {
        console.error('Failed to fetch pending cheat sheets:', cheatsheetError);
        setPendingCheatsheets(0);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchVersion = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/health`);
      const data = await response.json();
      setVersion(data.version);
    } catch (error) {
      console.error('Failed to fetch version:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await adminAPI.getAllTickets({
        status: ticketFilter !== 'all' ? ticketFilter : undefined
      });
      setSupportTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  };

  const handleApprove = async (orderId) => {
    if (!window.confirm('Are you sure you want to approve this payment?')) {
      return;
    }

    try {
      await adminAPI.approvePayment(orderId);
      toast.success('Payment approved!');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Approval failed:', error);
      toast.error(error.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (orderId) => {
    const reason = window.prompt('Reason for rejection (optional):');
    if (reason === null) return; // User cancelled

    try {
      await adminAPI.rejectPayment(orderId, reason);
      toast.success('Payment rejected');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Rejection failed:', error);
      toast.error(error.response?.data?.message || 'Rejection failed');
    }
  };

  const handleTicketStatusChange = async (ticketId, newStatus) => {
    try {
      await adminAPI.updateTicketStatus(ticketId, newStatus);
      toast.success('Ticket status updated');
      fetchTickets();
    } catch (error) {
      console.error('Failed to update ticket:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const toggleMessageExpansion = (ticketId) => {
    setExpandedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Title>{isAdmin ? 'Admin Dashboard' : 'Approvals Dashboard'}</Title>
        {version && (
          <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>
            v{version}
          </span>
        )}
      </div>

      {stats && (
        <StatsGrid>
          {isAdmin && (
            <StatCard as={Link} to="/admin/users" $clickable>
              <h3>Total Users</h3>
              <p>{stats.total_users}</p>
            </StatCard>
          )}
          <StatCard as={Link} to="/admin/cheatsheets" $clickable>
            <h3>Total Cheat Sheets</h3>
            <p>{stats.total_cheatsheets}</p>
          </StatCard>
          {isAdmin && (
            <>
              <StatCard>
                <h3>Completed Purchases</h3>
                <p>{stats.completed_purchases}</p>
              </StatCard>
              <StatCard>
                <h3>Total Revenue</h3>
                <p>{parseFloat(stats.total_revenue || 0).toFixed(2)} ฿</p>
              </StatCard>
            </>
          )}
          <StatCard $clickable style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: document.querySelector('section').offsetTop, behavior: 'smooth' })}>
            <h3>Pending Payment Approvals</h3>
            <p>{stats.pending_purchases}</p>
          </StatCard>
          <StatCard as={Link} to="/admin/seller-approvals" $clickable>
            <h3>Pending Seller Apps</h3>
            <p>{pendingSellerApps}</p>
          </StatCard>
          <StatCard as={Link} to="/admin/cheatsheet-approvals" $clickable>
            <h3>Pending Cheat Sheets</h3>
            <p>{pendingCheatsheets}</p>
          </StatCard>
        </StatsGrid>
      )}

      <Section>
        <SectionTitle>Pending Payment Approvals ({pendingPayments.length})</SectionTitle>

        {pendingPayments.length === 0 ? (
          <EmptyState>No pending payments to review</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>User</th>
                <th>Cheat Sheet</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingPayments.map((payment) => (
                <tr key={payment.order_id}>
                  <td>#{payment.order_id}</td>
                  <td>
                    <div>{payment.user_name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      {payment.user_email}
                    </div>
                  </td>
                  <td>
                    <div>{payment.cheatsheet_title}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      {payment.course_code}
                    </div>
                  </td>
                  <td>{parseFloat(payment.payment_amount || 0).toFixed(2)} ฿</td>
                  <td>{new Date(payment.purchase_date).toLocaleDateString()}</td>
                  <td>
                    <ButtonGroup>
                      <Button
                        variant="approve"
                        onClick={() => handleApprove(payment.order_id)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="reject"
                        onClick={() => handleReject(payment.order_id)}
                      >
                        Reject
                      </Button>
                    </ButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      {/* Support Tickets - Only for admins */}
      {isAdmin && (
        <Section>
          <SectionTitle>Support Tickets</SectionTitle>

          <FilterGroup>
            <FilterLabel>Filter by status:</FilterLabel>
            <Select value={ticketFilter} onChange={(e) => setTicketFilter(e.target.value)}>
              <option value="all">All Tickets</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </Select>
          </FilterGroup>

          {supportTickets.length === 0 ? (
            <EmptyState>No support tickets found</EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {supportTickets.map((ticket) => (
                  <tr key={ticket.ticket_id}>
                    <td>#{ticket.ticket_id}</td>
                    <td>
                      <div>{ticket.user_name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        {ticket.user_email}
                      </div>
                    </td>
                    <td>
                      <Badge status={ticket.ticket_type}>{ticket.ticket_type}</Badge>
                    </td>
                    <td>
                      <MessageCell
                        expanded={expandedTickets.has(ticket.ticket_id)}
                        onClick={() => toggleMessageExpansion(ticket.ticket_id)}
                      >
                        <div className="message-text">{ticket.message}</div>
                        {ticket.message.length > 50 && (
                          <div className="expand-hint">
                            {expandedTickets.has(ticket.ticket_id) ? 'Click to collapse' : 'Click to expand'}
                          </div>
                        )}
                      </MessageCell>
                    </td>
                    <td>
                      <Badge status={ticket.ticket_status}>{ticket.ticket_status}</Badge>
                    </td>
                    <td>{new Date(ticket.submitted_date).toLocaleDateString()}</td>
                    <td>
                      <Select
                        value={ticket.ticket_status}
                        onChange={(e) => handleTicketStatusChange(ticket.ticket_id, e.target.value)}
                      >
                        <option value="open">Open</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Section>
      )}

    </Container>
  );
};

export default AdminDashboard;

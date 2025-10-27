import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { analyticsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 60px);
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: ${props => props.theme.typography.sizes['3xl']};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.text};
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  font-size: ${props => props.theme.typography.sizes.base};
  color: ${props => props.theme.colors.textSecondary};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const Card = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.radius.lg};
  padding: 1.5rem;
  box-shadow: ${props => props.theme.shadows.md};
  border: 1px solid ${props => props.theme.colors.border};
`;

const CardTitle = styled.h3`
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
`;

const CardValue = styled.div`
  font-size: ${props => props.theme.typography.sizes['3xl']};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.25rem;
`;

const CardLabel = styled.div`
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.textTertiary};
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: ${props => props.theme.typography.sizes.xl};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.text};
  margin-bottom: 1rem;
`;

const Table = styled.table`
  width: 100%;
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.radius.lg};
  overflow: hidden;
  box-shadow: ${props => props.theme.shadows.md};
  border: 1px solid ${props => props.theme.colors.border};
`;

const TableHeader = styled.thead`
  background: ${props => props.theme.colors.backgroundSecondary};
`;

const TableRow = styled.tr`
  border-bottom: 1px solid ${props => props.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${props => props.theme.colors.backgroundSecondary};
  }
`;

const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TableCell = styled.td`
  padding: 1rem;
  font-size: ${props => props.theme.typography.sizes.base};
  color: ${props => props.theme.colors.text};
`;

const Badge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: ${props => props.theme.colors.primaryLight};
  color: ${props => props.theme.colors.primary};
  border-radius: ${props => props.theme.radius.full};
  font-size: ${props => props.theme.typography.sizes.xs};
  font-weight: ${props => props.theme.typography.weights.semibold};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${props => props.theme.colors.textTertiary};
  font-size: ${props => props.theme.typography.sizes.base};
`;

const EventTypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const EventTypeCard = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  padding: 1rem;
  text-align: center;
`;

const EventType = styled.div`
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 0.5rem;
  text-transform: capitalize;
`;

const EventCount = styled.div`
  font-size: ${props => props.theme.typography.sizes['2xl']};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.text};
`;

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Scroll to top when component mounts or route changes
    window.scrollTo(0, 0);
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await analyticsAPI.getSummary();
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return (
      <Container>
        <EmptyState>Failed to load analytics data</EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Analytics Dashboard</Title>
        <Subtitle>Last 30 days overview</Subtitle>
      </Header>

      {/* User Metrics */}
      <Grid>
        <Card>
          <CardTitle>Active Users</CardTitle>
          <CardValue>{data.userMetrics?.active_users || 0}</CardValue>
          <CardLabel>Unique users with activity</CardLabel>
        </Card>
        <Card>
          <CardTitle>Total Sessions</CardTitle>
          <CardValue>{data.userMetrics?.total_sessions || 0}</CardValue>
          <CardLabel>Individual browsing sessions</CardLabel>
        </Card>
        <Card>
          <CardTitle>Total Events</CardTitle>
          <CardValue>{data.userMetrics?.total_events || 0}</CardValue>
          <CardLabel>All tracked interactions</CardLabel>
        </Card>
      </Grid>

      {/* Event Types */}
      <Section>
        <SectionTitle>Events by Type</SectionTitle>
        {data.eventCounts && data.eventCounts.length > 0 ? (
          <EventTypeGrid>
            {data.eventCounts.map((event, index) => (
              <EventTypeCard key={index}>
                <EventType>{event.event_type.replace('_', ' ')}</EventType>
                <EventCount>{event.count}</EventCount>
              </EventTypeCard>
            ))}
          </EventTypeGrid>
        ) : (
          <Card>
            <EmptyState>No event data available</EmptyState>
          </Card>
        )}
      </Section>

      {/* Top Cheat Sheets */}
      <Section>
        <SectionTitle>Top Viewed Cheat Sheets</SectionTitle>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Rank</TableHeaderCell>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell>Course Code</TableHeaderCell>
              <TableHeaderCell>Views</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {data.topCheatSheets && data.topCheatSheets.length > 0 ? (
              data.topCheatSheets.map((sheet, index) => (
                <TableRow key={sheet.cheatsheet_id}>
                  <TableCell>
                    <Badge>#{index + 1}</Badge>
                  </TableCell>
                  <TableCell>{sheet.title}</TableCell>
                  <TableCell>{sheet.course_code}</TableCell>
                  <TableCell><strong>{sheet.view_count}</strong></TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="4">
                  <EmptyState>No cheat sheet views recorded</EmptyState>
                </TableCell>
              </TableRow>
            )}
          </tbody>
        </Table>
      </Section>

      {/* Top Searches */}
      <Section>
        <SectionTitle>Top Search Queries</SectionTitle>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Rank</TableHeaderCell>
              <TableHeaderCell>Search Query</TableHeaderCell>
              <TableHeaderCell>Count</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {data.topSearches && data.topSearches.length > 0 ? (
              data.topSearches.map((search, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Badge>#{index + 1}</Badge>
                  </TableCell>
                  <TableCell>{search.search_query || 'Unknown'}</TableCell>
                  <TableCell><strong>{search.search_count}</strong></TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="3">
                  <EmptyState>No search queries recorded</EmptyState>
                </TableCell>
              </TableRow>
            )}
          </tbody>
        </Table>
      </Section>

      {/* Footer Link Clicks */}
      <Section>
        <SectionTitle>Footer Link Clicks</SectionTitle>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Rank</TableHeaderCell>
              <TableHeaderCell>Link Name</TableHeaderCell>
              <TableHeaderCell>Link Type</TableHeaderCell>
              <TableHeaderCell>Clicks</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {data.footerClicks && data.footerClicks.length > 0 ? (
              data.footerClicks.map((link, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Badge>#{index + 1}</Badge>
                  </TableCell>
                  <TableCell>{link.link_name}</TableCell>
                  <TableCell>
                    <Badge style={{
                      background: link.link_type === 'external' ? '#FF9500' : '#34C759',
                      color: 'white'
                    }}>
                      {link.link_type}
                    </Badge>
                  </TableCell>
                  <TableCell><strong>{link.click_count}</strong></TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="4">
                  <EmptyState>No footer link clicks recorded</EmptyState>
                </TableCell>
              </TableRow>
            )}
          </tbody>
        </Table>
      </Section>

      {/* Daily Events (last 7 days) */}
      <Section>
        <SectionTitle>Recent Daily Activity</SectionTitle>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Event Type</TableHeaderCell>
              <TableHeaderCell>Count</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {data.dailyEvents && data.dailyEvents.length > 0 ? (
              data.dailyEvents.slice(0, 20).map((event, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                  <TableCell style={{ textTransform: 'capitalize' }}>
                    {event.event_type.replace('_', ' ')}
                  </TableCell>
                  <TableCell><strong>{event.count}</strong></TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="3">
                  <EmptyState>No daily activity recorded</EmptyState>
                </TableCell>
              </TableRow>
            )}
          </tbody>
        </Table>
      </Section>
    </Container>
  );
};

export default Analytics;

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cheatSheetsAPI, analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StarIcon, EyeIcon, CartIcon } from '../components/Icons';
import LoadingSpinner from '../components/LoadingSpinner';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 60px);
  background: ${props => props.theme.colors.background};
  transition: background ${props => props.theme.transitions.normal};
`;

const Header = styled.div`
  margin-bottom: 2.5rem;
  text-align: center;

  @media (min-width: 769px) {
    text-align: left;
  }
`;

const Title = styled.h1`
  font-size: ${props => props.theme.typography.sizes['4xl']};
  margin-bottom: 0.75rem;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.bold};
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: ${props => props.theme.typography.sizes['3xl']};
  }
`;

const Subtitle = styled.p`
  font-size: ${props => props.theme.typography.sizes.lg};
  color: ${props => props.theme.colors.textSecondary};
  font-weight: ${props => props.theme.typography.weights.medium};
`;

const Filters = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 250px;
  padding: 0.875rem 1.125rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.base};
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  transition: all ${props => props.theme.transitions.fast};

  &::placeholder {
    color: ${props => props.theme.colors.textTertiary};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primaryLight};
  }
`;

const Select = styled.select`
  padding: 0.875rem 1.125rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.base};
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  font-weight: ${props => props.theme.typography.weights.medium};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primaryLight};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.radius.lg};
  overflow: hidden;
  box-shadow: ${props => props.theme.shadows.md};
  border: 1px solid ${props => props.theme.colors.border};
  transition: all ${props => props.theme.transitions.normal};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.lg};
    border-color: ${props => props.theme.colors.primary};
  }
`;

const PurchasedBadge = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  background: ${props => props.theme.colors.success};
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: ${props => props.theme.typography.weights.bold};
  box-shadow: ${props => props.theme.shadows.md};
  z-index: 10;
`;

const PreviewImageContainer = styled.div`
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: ${props => props.theme.colors.backgroundSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid ${props => props.theme.colors.borderLight};
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const NoPreviewPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.primary};
  color: white;
  font-size: ${props => props.theme.typography.sizes['4xl']};
  font-weight: ${props => props.theme.typography.weights.bold};
  letter-spacing: 0.05em;
`;

const CardContent = styled.div`
  padding: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const CourseCode = styled.span`
  display: inline-block;
  background: ${props => props.theme.colors.primary};
  color: white;
  padding: 0.375rem 0.875rem;
  border-radius: ${props => props.theme.radius.full};
  font-size: ${props => props.theme.typography.sizes.xs};
  font-weight: ${props => props.theme.typography.weights.semibold};
  letter-spacing: 0.02em;
  text-transform: uppercase;
`;

const TagsContainer = styled.div`
  margin-bottom: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const MetaTag = styled.span`
  display: inline-block;
  background: ${props => props.theme.colors.backgroundSecondary};
  color: ${props => props.theme.colors.textSecondary};
  padding: 0.375rem 0.875rem;
  border-radius: ${props => props.theme.radius.full};
  font-size: ${props => props.theme.typography.sizes.xs};
  font-weight: ${props => props.theme.typography.weights.medium};
`;

const CheatSheetTitle = styled.h3`
  font-size: ${props => props.theme.typography.sizes.lg};
  margin: 0.5rem 0;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.semibold};
  line-height: ${props => props.theme.typography.lineHeights.tight};
`;

const Description = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.typography.sizes.sm};
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: ${props => props.theme.typography.lineHeights.relaxed};
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid ${props => props.theme.colors.borderLight};
  margin-top: auto;
`;

const Price = styled.div`
  font-size: ${props => props.theme.typography.sizes['2xl']};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.primary};
  letter-spacing: -0.01em;
`;

const Stats = styled.div`
  display: flex;
  gap: 0.75rem;
  font-size: ${props => props.theme.typography.sizes.xs};
  color: ${props => props.theme.colors.textSecondary};
  align-items: center;

  span {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
`;

const Badge = styled.span`
  background: ${props => props.theme.colors.success};
  color: white;
  padding: 0.375rem 0.625rem;
  border-radius: ${props => props.theme.radius.sm};
  font-size: ${props => props.theme.typography.sizes.xs};
  font-weight: ${props => props.theme.typography.weights.semibold};
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const Loading = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  font-size: ${props => props.theme.typography.sizes.lg};
  color: ${props => props.theme.colors.textSecondary};
`;

const Home = () => {
  const [cheatSheets, setCheatSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check for authentication errors from URL params
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      switch (error) {
        case 'invalid_domain':
          toast.error(
            'Access Denied: Only SIIT students with @g.siit.tu.ac.th email are allowed to login.', { duration: 6000 });
          break;
        case 'auth_failed':
          toast.error('Authentication failed. Please try again.', { duration: 5000 });
          break;
        case 'auth_error':
          toast.error('An error occurred during authentication. Please try again.', { duration: 5000 });
          break;
        case 'login_error':
          toast.error('Login error. Please try again.', { duration: 5000 });
          break;
        default:
          toast.error('Authentication error. Please try again.', { duration: 5000 });
      }
      
      // Clear the error from URL
      searchParams.delete('error');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCheatSheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCheatSheets = async () => {
    try {
      setLoading(true);
      // Fetch all cheat sheets without server-side sorting
      const response = await cheatSheetsAPI.getAll({ search });
      setCheatSheets(response.data.cheat_sheets || []);

      // Track search event if there's a search query
      if (search && search.trim()) {
        analyticsAPI.track('search', {
          additional_data: { query: search.trim() },
          page_url: window.location.pathname + window.location.search
        }).catch(err => console.error('Analytics tracking failed:', err));
      }
    } catch (error) {
      console.error('Failed to fetch cheat sheets:', error);
      // Show empty state instead of crashing
      setCheatSheets([]);
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please check your connection.');
      } else if (!error.response) {
        toast.error('Unable to connect to server. Please check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Client-side sorting function
  const getSortedCheatSheets = () => {
    const sheets = [...cheatSheets];

    switch (sort) {
      case 'newest':
        return sheets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'oldest':
        return sheets.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'price_high':
        return sheets.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      case 'price_low':
        return sheets.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      case 'popular':
        return sheets.sort((a, b) => (b.purchase_count || 0) - (a.purchase_count || 0));
      case 'rating':
        return sheets.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
      default:
        return sheets;
    }
  };

  const sortedCheatSheets = getSortedCheatSheets();

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCheatSheets();
  };

  const handleCardClick = React.useCallback((id) => {
    navigate(`/cheatsheet/${id}`);
  }, [navigate]);

  if (loading) {
    return <LoadingSpinner text="Loading cheat sheets..." fullHeight={true} />;
  }

  return (
    <Container>
      <Header>
        <Title>Browse Cheat Sheets</Title>
        <Subtitle>For SIIT students From Peanut</Subtitle>
      </Header>

      <form onSubmit={handleSearch}>
        <Filters>
          <SearchInput
            type="text"
            placeholder="Search by title, course code, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </Select>
        </Filters>
      </form>

      {sortedCheatSheets.length === 0 ? (
        <Loading>No cheat sheets found</Loading>
      ) : (
        <Grid>
          {sortedCheatSheets.map((sheet) => (
            <Card key={sheet.cheatsheet_id} onClick={() => handleCardClick(sheet.cheatsheet_id)}>
              {sheet.is_purchased && <PurchasedBadge>✓</PurchasedBadge>}
              <PreviewImageContainer>
                {sheet.preview_image_path && sheet.preview_image_path.startsWith('http') ? (
                  <PreviewImage
                    src={sheet.preview_image_path}
                    alt={sheet.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const placeholder = e.target.nextSibling;
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                ) : null}
                {(!sheet.preview_image_path || !sheet.preview_image_path.startsWith('http')) && (
                  <NoPreviewPlaceholder>
                    {sheet.course_code}
                  </NoPreviewPlaceholder>
                )}
              </PreviewImageContainer>
              <CardContent>
                <TagsContainer>
                  <CourseCode>{sheet.course_code}</CourseCode>
                  {sheet.exam_type && <MetaTag>{sheet.exam_type}</MetaTag>}
                </TagsContainer>
                <CheatSheetTitle>{sheet.title}</CheatSheetTitle>
                <Description>{sheet.description}</Description>
                <CardFooter>
                  <Price>
                    {parseFloat(sheet.price || 0) === 0 ? 'FREE' : `${parseFloat(sheet.price).toFixed(2)} ฿`}
                  </Price>
                  <Stats>
                    <span><StarIcon size={14} /> {parseFloat(sheet.average_rating || 0).toFixed(1)}</span>
                    <span><EyeIcon size={14} /> {sheet.view_count}</span>
                    <span><CartIcon size={14} /> {sheet.purchase_count}</span>
                  </Stats>
                </CardFooter>
              </CardContent>
            </Card>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Home;

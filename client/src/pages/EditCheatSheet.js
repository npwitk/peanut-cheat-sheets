import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { cheatSheetsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 60px);
  background: ${props => props.theme.colors.background};
`;

const Card = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.radius.lg};
  padding: 2rem;
  box-shadow: ${props => props.theme.shadows.md};
  border: 1px solid ${props => props.theme.colors.border};
`;

const Title = styled.h1`
  font-size: ${props => props.theme.typography.sizes['3xl']};
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.bold};
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 2rem;
  font-size: ${props => props.theme.typography.sizes.base};
`;

const InfoBox = styled.div`
  background: ${props => props.theme.colors.primaryLight};
  border: 1px solid ${props => props.theme.colors.primary};
  border-radius: ${props => props.theme.radius.md};
  padding: 1rem;
  margin-bottom: 2rem;
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.typography.sizes.sm};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.typography.sizes.sm};

  span {
    color: ${props => props.theme.colors.error};
  }
`;

const Input = styled.input`
  padding: 0.875rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.base};
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  transition: all ${props => props.theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primaryLight};
  }

  &[type="file"] {
    padding: 0.5rem;
  }
`;

const TextArea = styled.textarea`
  padding: 0.875rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.base};
  min-height: ${props => props.$minHeight || '100px'};
  resize: vertical;
  font-family: inherit;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  transition: all ${props => props.theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primaryLight};
  }
`;

const MarkdownToolbar = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: ${props => props.theme.colors.backgroundSecondary};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  flex-wrap: wrap;
`;

const ToolbarButton = styled.button`
  padding: 0.375rem 0.75rem;
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.sm};
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.medium};
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    background: ${props => props.theme.colors.primary};
    color: white;
    border-color: ${props => props.theme.colors.primary};
  }

  &:active {
    transform: translateY(1px);
  }
`;

const PreviewToggle = styled.button`
  margin-left: auto;
  padding: 0.375rem 0.75rem;
  background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.surface};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  border: 1px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${props => props.theme.radius.sm};
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.medium};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    background: ${props => props.$active ? props.theme.colors.primaryHover : props.theme.colors.backgroundTertiary};
  }
`;

const MarkdownPreview = styled.div`
  padding: 0.875rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  min-height: 150px;
  background: ${props => props.theme.colors.backgroundSecondary};
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.typography.sizes.base};
  line-height: ${props => props.theme.typography.lineHeights.relaxed};

  /* Markdown styles */
  p {
    margin-bottom: 1rem;
  }

  ul, ol {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
  }

  li {
    margin-bottom: 0.5rem;
  }

  strong {
    font-weight: ${props => props.theme.typography.weights.bold};
  }

  em {
    font-style: italic;
  }

  code {
    background: ${props => props.theme.colors.surface};
    padding: 0.125rem 0.375rem;
    border-radius: ${props => props.theme.radius.sm};
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
  }

  pre {
    background: ${props => props.theme.colors.surface};
    padding: 1rem;
    border-radius: ${props => props.theme.radius.md};
    overflow-x: auto;
    margin-bottom: 1rem;

    code {
      background: none;
      padding: 0;
    }
  }

  blockquote {
    border-left: 4px solid ${props => props.theme.colors.primary};
    padding-left: 1rem;
    margin-left: 0;
    margin-bottom: 1rem;
    font-style: italic;
  }

  h1, h2, h3 {
    font-weight: ${props => props.theme.typography.weights.bold};
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }

  h1 { font-size: ${props => props.theme.typography.sizes.xl}; }
  h2 { font-size: ${props => props.theme.typography.sizes.lg}; }
  h3 { font-size: ${props => props.theme.typography.sizes.base}; }
`;

const Select = styled.select`
  padding: 0.875rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.base};
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primaryLight};
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const FileInfo = styled.div`
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.textSecondary};
  margin-top: 0.25rem;
`;

const PreviewImage = styled.div`
  margin-top: 0.5rem;

  img {
    max-width: 300px;
    max-height: 200px;
    border-radius: ${props => props.theme.radius.md};
    border: 1px solid ${props => props.theme.colors.border};
    object-fit: cover;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  flex: 1;
  padding: 0.875rem 2rem;
  border: none;
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.base};
  font-weight: ${props => props.theme.typography.weights.semibold};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  ${props => props.variant === 'primary' ? `
    background: ${props.theme.colors.primary};
    color: white;
    box-shadow: ${props.theme.shadows.sm};

    &:hover {
      background: ${props.theme.colors.primaryHover};
      transform: translateY(-1px);
      box-shadow: ${props.theme.shadows.md};
    }

    &:disabled {
      background: ${props.theme.colors.textTertiary};
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  ` : `
    background: transparent;
    color: ${props.theme.colors.text};
    border: 2px solid ${props.theme.colors.border};

    &:hover {
      border-color: ${props.theme.colors.textSecondary};
      background: ${props.theme.colors.backgroundSecondary};
    }
  `}
`;

const YouTubeLinksContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const YouTubeLinkRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const RemoveButton = styled.button`
  padding: 0.875rem;
  background: ${props => props.theme.colors.error};
  color: white;
  border: none;
  border-radius: ${props => props.theme.radius.md};
  cursor: pointer;
  font-weight: ${props => props.theme.typography.weights.semibold};
  transition: all ${props => props.theme.transitions.fast};
  min-width: 80px;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const AddLinkButton = styled.button`
  padding: 0.875rem;
  background: ${props => props.theme.colors.success};
  color: white;
  border: none;
  border-radius: ${props => props.theme.radius.md};
  cursor: pointer;
  font-weight: ${props => props.theme.typography.weights.semibold};
  transition: all ${props => props.theme.transitions.fast};
  margin-top: 0.5rem;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const HelpText = styled.div`
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.textSecondary};
  margin-top: 0.25rem;
`;

function EditCheatSheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewImageFile, setPreviewImageFile] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [youtubeLinks, setYoutubeLinks] = useState(['']);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_code: '',
    semester: '',
    academic_year: '',
    year_level: '',
    exam_type: '',
    price: ''
  });

  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchCheatSheet();
  }, [id]);

  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const yearLevels = [
    { value: 'Freshman', label: 'Freshman (Year 1)' },
    { value: 'Sophomore', label: 'Sophomore (Year 2)' },
    { value: 'Junior', label: 'Junior (Year 3)' },
    { value: 'Senior', label: 'Senior (Year 4)' }
  ];
  const examTypes = [
    { value: 'Midterm', label: 'Midterm Exam' },
    { value: 'Final', label: 'Final Exam' },
    { value: 'Quiz', label: 'Quiz'}
  ];

  const fetchCheatSheet = async () => {
    try {
      setLoading(true);
      const response = await cheatSheetsAPI.getById(id);
      const cheatSheet = response.data.cheat_sheet;

      setFormData({
        title: cheatSheet.title || '',
        description: cheatSheet.description || '',
        course_code: cheatSheet.course_code || '',
        semester: cheatSheet.semester || '',
        academic_year: cheatSheet.academic_year || '',
        year_level: cheatSheet.year_level || '',
        exam_type: cheatSheet.exam_type || '',
        price: cheatSheet.price || ''
      });

      if (cheatSheet.preview_image_path) {
        setPreviewImageUrl(cheatSheet.preview_image_path);
      }

      if (cheatSheet.youtube_links) {
        try {
          const links = JSON.parse(cheatSheet.youtube_links);
          setYoutubeLinks(links.length > 0 ? links : ['']);
        } catch (e) {
          setYoutubeLinks(['']);
        }
      }
    } catch (error) {
      console.error('Error fetching cheat sheet:', error);
      toast.error(error.response?.data?.message || 'Failed to load cheat sheet');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const insertMarkdown = (before, after = '') => {
    const textarea = document.querySelector('textarea[name="description"]');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.description;
    const selectedText = text.substring(start, end);

    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);

    setFormData(prev => ({
      ...prev,
      description: newText
    }));

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const cursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  const handlePreviewImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file (JPG, PNG, etc.)');
        e.target.value = '';
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Image size must be less than 5MB');
        e.target.value = '';
        return;
      }

      setPreviewImageFile(file);
      setPreviewImageUrl(URL.createObjectURL(file));
    }
  };

  const handleYoutubeLinkChange = (index, value) => {
    const newLinks = [...youtubeLinks];
    newLinks[index] = value;
    setYoutubeLinks(newLinks);
  };

  const addYoutubeLink = () => {
    setYoutubeLinks([...youtubeLinks, '']);
  };

  const removeYoutubeLink = (index) => {
    const newLinks = youtubeLinks.filter((_, i) => i !== index);
    setYoutubeLinks(newLinks.length > 0 ? newLinks : ['']);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim() || !formData.description.trim() || !formData.course_code.trim() || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.price) < 0) {
      toast.error('Price cannot be negative');
      return;
    }

    try {
      setSubmitting(true);

      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });

      // Filter out empty YouTube links
      const validLinks = youtubeLinks.filter(link => link.trim() !== '');
      if (validLinks.length > 0) {
        submitData.append('youtube_links', JSON.stringify(validLinks));
      }

      if (previewImageFile) {
        submitData.append('preview_image', previewImageFile);
      }

      await cheatSheetsAPI.edit(id, submitData);
      toast.success('Cheat sheet updated successfully!');
      navigate(`/cheatsheet/${id}`);
    } catch (error) {
      console.error('Error updating cheat sheet:', error);
      toast.error(error.response?.data?.message || 'Failed to update cheat sheet');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/cheatsheet/${id}`);
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
      <Card>
        <Title>Edit Cheat Sheet</Title>
        <Subtitle>Update your cheat sheet information</Subtitle>

        <InfoBox>
          Note: You can update the title, description, metadata, and preview image. The actual PDF file cannot be changed.
        </InfoBox>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>
              Title <span>*</span>
            </Label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., AI Midterm Cheat Sheet (SO GOOD!)"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>
              Description <span>*</span>
            </Label>
            <MarkdownToolbar>
              <ToolbarButton type="button" onClick={() => insertMarkdown('**', '**')} title="Bold">
                <strong>B</strong>
              </ToolbarButton>
              <ToolbarButton type="button" onClick={() => insertMarkdown('*', '*')} title="Italic">
                <em>I</em>
              </ToolbarButton>
              <ToolbarButton type="button" onClick={() => insertMarkdown('`', '`')} title="Code">
                &lt;/&gt;
              </ToolbarButton>
              <ToolbarButton type="button" onClick={() => insertMarkdown('- ')} title="Bullet List">
                • List
              </ToolbarButton>
              <ToolbarButton type="button" onClick={() => insertMarkdown('1. ')} title="Numbered List">
                1. List
              </ToolbarButton>
              <ToolbarButton type="button" onClick={() => insertMarkdown('[', '](url)')} title="Link">
                Link
              </ToolbarButton>
              <ToolbarButton type="button" onClick={() => insertMarkdown('# ')} title="Heading 1">
                H1
              </ToolbarButton>
              <ToolbarButton type="button" onClick={() => insertMarkdown('## ')} title="Heading 2">
                H2
              </ToolbarButton>
              <ToolbarButton type="button" onClick={() => insertMarkdown('### ')} title="Heading 3">
                H3
              </ToolbarButton>
              <PreviewToggle
                type="button"
                $active={showPreview}
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </PreviewToggle>
            </MarkdownToolbar>
            {!showPreview ? (
              <TextArea
                name="description"
                placeholder="Describe what's included in this cheat sheet... (Markdown supported)"
                value={formData.description}
                onChange={handleInputChange}
                $minHeight="150px"
                required
              />
            ) : (
              <MarkdownPreview>
                {formData.description ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({node, ...props}) => {
                        const href = props.href || '';
                        const fixedHref = href.match(/^https?:\/\//) ? href : `https://${href}`;
                        return <a {...props} href={fixedHref} target="_blank" rel="noopener noreferrer" />;
                      }
                    }}
                  >
                    {formData.description}
                  </ReactMarkdown>
                ) : (
                  <em style={{ color: '#999' }}>Preview will appear here...</em>
                )}
              </MarkdownPreview>
            )}
          </FormGroup>

          <Row>
            <FormGroup>
              <Label>
                Course Code <span>*</span>
              </Label>
              <Input
                type="text"
                name="course_code"
                placeholder="e.g., CS101"
                value={formData.course_code}
                onChange={handleInputChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>
                Price (THB) <span>*</span>
              </Label>
              <Input
                type="number"
                name="price"
                placeholder="e.g., 50"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
          </Row>

          <Row>
            <FormGroup>
              <Label>Semester</Label>
              <Select
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
              >
                <option value="">Select semester (optional)</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3 (Summer)">3 (Summer)</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Academic Year</Label>
              <Select
                name="academic_year"
                value={formData.academic_year}
                onChange={handleInputChange}
              >
                <option value="">Select year (optional)</option>
                {academicYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </Select>
            </FormGroup>
          </Row>

          <FormGroup>
            <Label>Year Level</Label>
            <Select
              name="year_level"
              value={formData.year_level}
              onChange={handleInputChange}
            >
              <option value="">Select year level (optional)</option>
              {yearLevels.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </Select>
            <HelpText>What year of study is this cheat sheet for?</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>Exam Type</Label>
            <Select
              name="exam_type"
              value={formData.exam_type}
              onChange={handleInputChange}
            >
              <option value="">Select exam type (optional)</option>
              {examTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Select>
            <HelpText>Is this cheat sheet for a Midterm or Final exam?</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>
              Preview Image (Optional)
            </Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handlePreviewImageChange}
            />
            {previewImageUrl && (
              <PreviewImage>
                <img src={previewImageUrl} alt="Preview" />
              </PreviewImage>
            )}
            {previewImageFile && (
              <FileInfo>
                ✓ Selected: {previewImageFile.name} ({(previewImageFile.size / 1024 / 1024).toFixed(2)} MB)
              </FileInfo>
            )}
            <FileInfo>
              Upload a preview image to show customers what the cheat sheet looks like.
              Recommended: Screenshot of first page. Max 5MB. Formats: JPG, PNG, WebP.
            </FileInfo>
          </FormGroup>

          <FormGroup>
            <Label>YouTube Video Links (Optional)</Label>
            <YouTubeLinksContainer>
              {youtubeLinks.map((link, index) => (
                <YouTubeLinkRow key={index}>
                  <Input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    value={link}
                    onChange={(e) => handleYoutubeLinkChange(index, e.target.value)}
                  />
                  {(youtubeLinks.length > 1 || link.trim() !== '') && (
                    <RemoveButton
                      type="button"
                      onClick={() => removeYoutubeLink(index)}
                    >
                      Remove
                    </RemoveButton>
                  )}
                </YouTubeLinkRow>
              ))}
              <AddLinkButton
                type="button"
                onClick={addYoutubeLink}
              >
                + Add Another Link
              </AddLinkButton>
            </YouTubeLinksContainer>
            <HelpText>
              Add YouTube video links related to this cheat sheet (e.g., lecture recordings, explanations).
              Supports both youtube.com and youtu.be formats.
            </HelpText>
          </FormGroup>

          <ButtonGroup>
            <Button type="button" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Cheat Sheet'}
            </Button>
          </ButtonGroup>
        </Form>
      </Card>
    </Container>
  );
}

export default EditCheatSheet;

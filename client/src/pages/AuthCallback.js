import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  font-size: 1.2rem;
  color: #666;
`;

const AuthCallback = () => {
  const navigate = useNavigate();
  const { handleAuthCallback } = useAuth();

  useEffect(() => {
    const processAuth = async () => {
      // Get token from URL query params
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const error = params.get('error');

      // DEBUG: Uncomment for troubleshooting auth flow (SECURITY: Remove in production)
      // console.log('Auth callback - token:', token);
      // console.log('Auth callback - error:', error);
      // console.log('Auth callback - full URL:', window.location.href);

      if (error) {
        console.error('Authentication failed:', error);
        alert('Authentication failed: ' + error);
        navigate('/');
        return;
      }

      if (token) {
        // DEBUG: Uncomment for troubleshooting (SECURITY: Remove in production)
        // console.log('Token received, storing and fetching user...');
        await handleAuthCallback(token);
        // DEBUG: Uncomment for troubleshooting (SECURITY: Remove in production)
        // console.log('User data loaded, navigating...');
        navigate('/');
      } else {
        console.error('No token in URL params');
        alert('No authentication token received');
        navigate('/');
      }
    };

    processAuth();
  }, [navigate, handleAuthCallback]);

  return <Container>Processing login...</Container>;
};

export default AuthCallback;

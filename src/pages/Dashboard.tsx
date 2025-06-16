import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Avatar,
  Container,
} from '@mui/material';
import {
  TrendingUp,
  Article,
  Bookmark,
  Person,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import './DashBoard.css'; // We'll create this CSS file

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const stats = [
    {
      title: 'Articles Read Today',
      value: '12',
      icon: <Article sx={{ fontSize: 40, color: '#667eea' }} />,
      action: () => navigate('/news'),
    },
    {
      title: 'Bookmarked Articles',
      value: '47',
      icon: <Bookmark sx={{ fontSize: 40, color: '#f093fb' }} />,
      action: () => navigate('/profile'),
    },
    {
      title: 'Reading Streak',
      value: '15 days',
      icon: <TrendingUp sx={{ fontSize: 40, color: '#4facfe' }} />,
      action: () => navigate('/profile'),
    },
    {
      title: 'Profile Views',
      value: '89',
      icon: <Person sx={{ fontSize: 40, color: '#43e97b' }} />,
      action: () => navigate('/profile'),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box>
        {/* Welcome Section */}
        <Paper 
          sx={{ 
            p: 3, 
            mb: 3, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{ width: 64, height: 64 }}
              src={user?.profile_picture}
              alt={user?.name}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ mb: 1 }}>
                Welcome back, {user?.name}! 👋
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Ready to catch up on today's news? You have 3 unread articles in your personalized feed.
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Stats Cards using Flexbox */}
        <div className="stats-container">
          {stats.map((stat, index) => (
            <Card 
              key={index}
              className="stat-card"
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                },
              }}
              onClick={stat.action}
            >
              <CardContent className="stat-card-content">
                <Box sx={{ mb: 2 }}>
                  {stat.icon}
                </Box>
                <Typography 
                  variant="h4" 
                  component="div" 
                  sx={{ 
                    fontWeight: 'bold',
                    mb: 1,
                    color: 'text.primary'
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ textAlign: 'center' }}
                >
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Section using Flexbox */}
        <div className="bottom-section">
          <Card className="highlights-card">
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                Today's Highlights
              </Typography>
              <Box sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • Breaking: Latest developments in technology sector
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • Sports: Championship finals this weekend
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • Business: Market trends for the week
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                onClick={() => navigate('/news')}
                sx={{ 
                  mt: 3,
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                  }
                }}
              >
                Read More News
              </Button>
            </CardContent>
          </Card>

          <Card className="actions-card">
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Button 
                  variant="outlined" 
                  fullWidth
                  onClick={() => navigate('/news')}
                >
                  Browse News
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth
                  onClick={() => navigate('/profile')}
                >
                  View Profile
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth
                  onClick={() => navigate('/profile')}
                >
                  Reading History
                </Button>
              </Box>
            </CardContent>
          </Card>
        </div>
      </Box>
    </Container>
  );
};

export default Dashboard;
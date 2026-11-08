import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Collapse, Paper } from '@mui/material';
import { AlertCircle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { clientObservability } from '../../utils/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error; reset: () => void }) => ReactNode);
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // Log to frontend observability and Sentry
    clientObservability.captureException(error, {
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  private toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback({
          error: this.state.error || new Error('Unknown error'),
          reset: this.handleReset,
        });
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#FBFBFA',
            p: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              maxWidth: 520,
              width: '100%',
              p: { xs: 3.5, sm: 5 },
              textAlign: 'center',
              borderRadius: 4,
              border: '1px solid #E4E9DC',
              bgcolor: '#ffffff',
              boxShadow: '0 8px 30px rgba(88, 117, 41, 0.08)',
            }}
          >
            {/* Friendly Non-Alarmist Badge */}
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'rgba(237, 218, 94, 0.25)',
                border: '1px solid #EDDA5E',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#587529',
                mb: 2.5,
              }}
            >
              <AlertCircle size={32} />
            </Box>

            {/* Clear Title */}
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#1C2411',
                mb: 1.5,
                letterSpacing: '-0.02em',
              }}
            >
              Something went wrong
            </Typography>

            {/* Friendly Non-Tech Safe Explanation */}
            <Typography
              variant="body1"
              sx={{
                color: '#556345',
                mb: 3.5,
                lineHeight: 1.6,
              }}
            >
              We encountered an unexpected issue while loading this page. Do not worry, your account and links are completely safe. Please try refreshing or return to the home screen.
            </Typography>

            {/* Action Buttons */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1.5,
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <Button
                variant="contained"
                disableElevation
                disableRipple
                onClick={this.handleReload}
                startIcon={<RefreshCw size={16} />}
                sx={{
                  bgcolor: '#587529',
                  color: '#ffffff',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#445b20',
                  },
                }}
              >
                Refresh page
              </Button>
              <Button
                variant="outlined"
                disableElevation
                disableRipple
                onClick={this.handleGoHome}
                startIcon={<Home size={16} />}
                sx={{
                  borderColor: '#E4E9DC',
                  color: '#1C2411',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#F3F6EC',
                    borderColor: '#CBD5BE',
                  },
                }}
              >
                Go to home
              </Button>
            </Box>

            {/* Collapsed Technical Details for Diagnostics */}
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #F3F6EC' }}>
              <Button
                size="small"
                disableRipple
                onClick={this.toggleDetails}
                endIcon={this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                sx={{
                  color: '#8A9A78',
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: 'transparent',
                    color: '#556345',
                  },
                }}
              >
                {this.state.showDetails ? 'Hide technical details' : 'View technical details'}
              </Button>

              <Collapse in={this.state.showDetails}>
                <Box
                  sx={{
                    mt: 1.5,
                    p: 2,
                    bgcolor: '#F8F9F5',
                    borderRadius: 2,
                    border: '1px solid #E4E9DC',
                    textAlign: 'left',
                    maxHeight: 180,
                    overflowY: 'auto',
                  }}
                >
                  <Typography
                    variant="caption"
                    component="div"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      color: '#c2410c',
                      fontWeight: 600,
                      wordBreak: 'break-word',
                      mb: 1,
                    }}
                  >
                    {this.state.error?.toString()}
                  </Typography>
                  {this.state.errorInfo?.componentStack && (
                    <Typography
                      variant="caption"
                      component="pre"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                        color: '#556345',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        m: 0,
                      }}
                    >
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  )}
                </Box>
              </Collapse>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

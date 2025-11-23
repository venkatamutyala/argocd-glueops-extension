(function() {
  'use strict';
  function initExtension() {
    if (typeof window.extensionsAPI === 'undefined') {
      setTimeout(initExtension, 500);
      return;
    }
    const extensionsAPI = window.extensionsAPI;
    function AppLinksComponent(props) {
      const application = props?.application || props?.item || props;
      const appName = application?.metadata?.name || application?.name || props?.name || '';
      const appNamespace = application?.metadata?.namespace || application?.namespace || props?.namespace || 'argocd';
      if (!appName) {
        return React.createElement('div', { style: { padding: '16px', color: '#666' } }, 'Application name not found');
      }
      const [links, setLinks] = React.useState({});
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState(null);
      const [hoveredGroup, setHoveredGroup] = React.useState(null);
      React.useEffect(() => {
        if (!appName) {
          setLoading(false);
          return;
        }
      const fetchLinks = async () => {
        try {
          setLoading(true);
          setError(null);
          const headerValue = `${appNamespace}:${appName}`;
          const headers = new Headers();
          headers.set('Accept', 'application/json');
          headers.set('Argocd-Application-Name', headerValue);
          headers.set('Argocd-Project-Name', 'default');
          
          // Create abort controller for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          try {
            // Call ArgoCD proxy extension (hardcoded proxy path)
            // ArgoCD will proxy this to https://postman-echo.com/get
            const response = await fetch(`/extensions/app-links-extension/get?appName=${encodeURIComponent(appName)}`, {
              method: 'GET',
              credentials: 'include',
              headers: headers,
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              // Server returned error status
              setError('offline');
              setLinks({});
              return;
            }
            const echoData = await response.json();
            // Extract app name from Postman Echo response (in args.appName)
            const echoAppName = echoData?.args?.appName || appName;
            
            // Generate links based on app name (mimicking server-side response)
            const data = {
              'Dashboard': [
                { label: 'Grafana Dashboard', url: `https://grafana.example.com/dashboard/${echoAppName}` },
                { label: 'Custom Dashboard', url: `https://custom.example.com/dash/${echoAppName}` },
                { label: 'Overview Dashboard', url: `https://overview.example.com/app/${echoAppName}` }
              ],
              'Logs': [
                { label: 'Kibana Logs', url: `https://kibana.example.com/logs/${echoAppName}` },
                { label: 'CloudWatch Logs', url: `https://cloudwatch.example.com/logs/${echoAppName}` },
                { label: 'Application Logs', url: `https://logs.example.com/app/${echoAppName}` }
              ],
              'Metrics': [
                { label: 'Prometheus Metrics', url: `https://prometheus.example.com/metrics/${echoAppName}` },
                { label: 'Datadog Metrics', url: `https://datadog.example.com/metrics/${echoAppName}` }
              ],
              'Documentation': [
                { label: 'API Docs', url: `https://docs.example.com/api/${echoAppName}` },
                { label: 'Runbook', url: `https://runbook.example.com/${echoAppName}` }
              ]
            };
            setLinks(data);
          } catch (fetchErr) {
            clearTimeout(timeoutId);
            throw fetchErr;
          }
        } catch (err) {
          // Network error, timeout, or other fetch failure
          // Silently handle - don't crash ArgoCD
          setError('offline');
          setLinks({});
        } finally {
          setLoading(false);
        }
      };
        fetchLinks();
      }, [appName, appNamespace]);
      const entries = Object.entries(links);
      const hasData = entries.length > 0 && !error;
      
      // GlueOps logo from CDN
      const beeLogo = React.createElement('img', {
        src: 'https://cdn.glueops.dev/logos/logo.png',
        alt: 'GlueOps Logo',
        style: {
          width: '20px',
          height: '20px',
          marginRight: '6px',
          flexShrink: 0,
          objectFit: 'contain'
        }
      });
      
      // Category icons (using Unicode/emoji for simplicity)
      const categoryIcons = {
        'Dashboard': '📊',
        'Logs': '📋',
        'Metrics': '📈',
        'Documentation': '📚'
      };
      
      return React.createElement('div', { 
        style: { 
          padding: '2px 6px',
          backgroundColor: '#ffffff',
          borderRadius: '3px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          margin: '0'
        } 
      },
        React.createElement('div', { 
          style: { 
            display: 'flex',
            alignItems: 'center',
            marginBottom: '2px',
            paddingBottom: '2px',
            borderBottom: '1px solid #f0f0f0'
          } 
        },
          beeLogo,
          React.createElement('h3', { 
            style: { 
              margin: 0,
              fontSize: '11px',
              fontWeight: 600,
              color: '#1a1a1a',
              letterSpacing: '-0.1px',
              lineHeight: '1.1'
            } 
          }, 'GlueOps')
        ),
        loading ? React.createElement('div', { 
          style: { 
            textAlign: 'center', 
            color: '#666', 
            padding: '8px 0',
            fontSize: '11px'
          } 
        }, '⏳ Loading...') :
        !hasData ? React.createElement('div', { 
          style: { 
            textAlign: 'center', 
            color: '#999', 
            padding: '8px 0',
            fontSize: '11px'
          } 
        }, '📭 No links') :
        React.createElement('div', { 
          style: { 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '4px',
            position: 'relative'
          } 
        },
          entries.map(([groupLabel, linkArray], groupIdx) => {
            const links = Array.isArray(linkArray) ? linkArray : [{ label: groupLabel, url: linkArray }];
            const isHovered = hoveredGroup === groupIdx;
            const icon = categoryIcons[groupLabel] || '🔗';
            const isSingleLink = links.length === 1;
            
            return React.createElement('div', {
              key: groupIdx,
              style: { position: 'relative' },
              onMouseEnter: () => setHoveredGroup(groupIdx),
              onMouseLeave: () => setHoveredGroup(null)
            }, 
              isSingleLink ? React.createElement('a', {
                href: typeof links[0] === 'string' ? links[0] : links[0].url,
                target: '_blank',
                rel: 'noopener noreferrer',
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: isHovered ? '#f8f9fa' : '#ffffff',
                  border: `1px solid ${isHovered ? '#d0d7de' : '#e1e4e8'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#24292f',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none',
                  boxShadow: isHovered ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }
              },
                React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
                  React.createElement('span', { style: { fontSize: '12px' } }, icon),
                  React.createElement('span', {}, typeof links[0] === 'string' ? groupLabel : links[0].label || groupLabel)
                ),
                React.createElement('span', { style: { fontSize: '10px', color: '#656d76' } }, '→')
              ) :
              React.createElement('div', {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 6px',
                  backgroundColor: isHovered ? '#f8f9fa' : '#ffffff',
                  border: `1px solid ${isHovered ? '#d0d7de' : '#e1e4e8'}`,
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#24292f',
                  transition: 'all 0.2s ease',
                  boxShadow: isHovered ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                }
              },
                React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
                  React.createElement('span', { style: { fontSize: '12px' } }, icon),
                  React.createElement('span', {}, groupLabel)
                ),
                React.createElement('span', { style: { fontSize: '8px', color: '#656d76', transform: isHovered ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' } }, '▼')
              ),
              isHovered && !isSingleLink && links.length > 1 && React.createElement('div', {
                style: {
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '2px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d0d7de',
                  borderRadius: '3px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                  padding: '2px 0',
                  overflow: 'hidden'
                }
              },
                links.map((link, linkIdx) =>
                  React.createElement('a', {
                    key: linkIdx,
                    href: typeof link === 'string' ? link : link.url,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    style: {
                      display: 'block',
                      padding: '6px 8px',
                      textDecoration: 'none',
                      color: '#24292f',
                      fontSize: '11px',
                      transition: 'background-color 0.15s',
                      borderBottom: linkIdx < links.length - 1 ? '1px solid #f0f0f0' : 'none'
                    },
                    onMouseEnter: (e) => { e.target.style.backgroundColor = '#f6f8fa'; },
                    onMouseLeave: (e) => { e.target.style.backgroundColor = 'transparent'; }
                  }, typeof link === 'string' ? link : link.label || link.url)
                )
              )
            );
          })
        )
      );
    }
    if (typeof extensionsAPI.registerStatusPanelExtension === 'function') {
      extensionsAPI.registerStatusPanelExtension(AppLinksComponent, 'GlueOps', 'glueops');
    }
    if (typeof extensionsAPI.registerAppViewExtension === 'function') {
      // Keep paperclip icon - no replacement needed
      extensionsAPI.registerAppViewExtension(AppLinksComponent, 'GlueOps', 'fa-link');
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExtension);
  } else {
    initExtension();
  }
})();

// App.jsx
import * as React from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Stack from '@mui/joy/Stack';
import Chip from '@mui/joy/Chip';
import Alert from '@mui/joy/Alert';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Warning from '@mui/icons-material/Warning';
import LinkIcon from '@mui/icons-material/Link';
import { useTheme } from './theme/ThemeContext';

export default function status() {
    const [msg, setMsg] = React.useState(null);

    // Use the theme manager hook - ALL theme logic is here
    const themeManager = useTheme('primary', 'solid');

    // Rest of your app logic remains the same...
    // React.useEffect(() => {
    //     const mockMsg = {
    //         type: "URL_PERMISSION_STATUS",
    //         url: "https://medium.com/@5tigerjelly/creating-a-chrome-extension-with-react-and-vite-boilerplate-provided-db3d14473bf6",
    //         originPattern: "https://medium.com/*",
    //         hasPerm: true,
    //         isMedium: true
    //     };
    //     handler(mockMsg);
    // }, []);

    React.useEffect(() => {

        chrome.storage.local.get("laststatus", (res) => {
            if (res?.laststatus) handler(res.laststatus);
        });

        // Optional: live update when background updates storage
        const onChanged = (changes, area) => {
            if (area === "local" && changes.lastStatus?.newValue) {
                handler(changes.lastStatus.newValue);
            }
        };
        chrome.storage.onChanged.addListener(onChanged);

        return () => chrome.storage.onChanged.removeListener(onChanged);

    }, []);

    const handler = (msg) => {
        if (msg?.type === "URL_PERMISSION_STATUS") {
            setMsg(msg);
            console.log("Permission status:", msg);
        }
    };

    if (!msg) {
        return (
            <Box sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: '#f5f5f5'
            }}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{
            bgcolor: 'background.default',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: "inherit"
        }}>
            <Box sx={{
                display: 'flex',
                width: '100%',
                maxWidth: 800,
                overflow: 'hidden',
                height: "inherit",
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>


                {/* Status Row */}
                <Box sx={[{
                    p: "3px",
                    mb: 3,
                    boxShadow: 'inset 0 0px 10px rgba(0, 0, 0, 0.49)',
                },
                (msg.isMedium && msg.hasPerm) ? { display: "none" } : { display: "block" }
                ]}>
                    <Stack
                        direction="row"
                        spacing={2}
                        justifyContent="start"
                        alignItems="center"
                        flexWrap="wrap"
                    >
                        {
                            !msg.isMedium && (
                                <Chip
                                    startDecorator={<Warning sx={{ fontSize: ".8rem" }} />}
                                    sx={{
                                        fontWeight: 'bold',
                                        fontSize: ".6rem",
                                        bgcolor: "#ff0a0af4"
                                    }}
                                >
                                    "Not Medium"
                                </Chip>
                            )
                        }

                        {!msg.hasPerm && (
                            <Chip
                                startDecorator={<Warning sx={{ fontSize: ".8rem" }} />}
                                sx={{
                                    fontWeight: 'bold',
                                    fontSize: ".6rem",
                                    bgcolor: "#ff0a0af4"
                                }}
                            >
                                Permissions Needed
                            </Chip>
                        )}
                    </Stack>
                </Box>

                {/* Information Content */}
                <Box sx={{
                    p: 2.5,
                    mb: 3
                }}>
                    {msg.isMedium ? (
                        <Stack spacing={2}>
                            <Alert
                                variant={themeManager.isSolid ? 'soft' : 'outlined'}
                                color={msg.hasPerm ? "success" : "warning"}
                                startDecorator={msg.hasPerm ? <CheckCircle /> : <Warning />}
                                sx={{ ...themeManager.getTextColor() }}
                            >
                                <Typography level="body2">
                                    {msg.hasPerm
                                        ? "All required permissions are granted for this site."
                                        : "Additional permissions required for full functionality."
                                    }
                                </Typography>
                            </Alert>

                            <Box>
                                <Typography level="body3" sx={{ mb: 1, opacity: 0.8, ...themeManager.getTextColor() }}>
                                    Current URL:
                                </Typography>
                                <Typography
                                    level="body2"
                                    sx={{
                                        wordBreak: 'break-all',
                                        fontFamily: 'monospace',
                                        p: 1,
                                        borderRadius: 'sm',
                                        bgcolor: themeManager.isSolid ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                                        ...themeManager.getTextColor()
                                    }}
                                >
                                    {msg.url}
                                </Typography>
                            </Box>
                        </Stack>
                    ) : (
                        <Stack spacing={2}>
                            <Alert variant={themeManager.isSolid ? 'soft' : 'outlined'} color="info" sx={{ ...themeManager.getTextColor() }}>
                                <Typography level="body2">
                                    This extension works on Medium sites
                                </Typography>
                            </Alert>

                            {msg.originPattern && (
                                <Box>
                                    <Typography level="body3" sx={{ mb: 1, opacity: 0.8, ...themeManager.getTextColor() }}>
                                        Required pattern:
                                    </Typography>
                                    <Chip
                                        startDecorator={<LinkIcon />}
                                        variant="outlined"
                                        size="sm"
                                        sx={{
                                            fontSize: '0.8rem',
                                            ...themeManager.getTextColor()
                                        }}
                                    >
                                        {msg.originPattern}
                                    </Chip>
                                </Box>
                            )}
                        </Stack>
                    )}
                </Box>

                {/* Status Summary */}
                <Alert
                    variant={themeManager.isSolid ? 'soft' : 'outlined'}
                    invertedColors
                    color={(msg.hasPerm && msg.isMedium) ? "success" : "warning"}
                    sx={{ borderRadius: 0, position: "absolute", bottom: 0, width: "100%", fontSize: ".6rem", padding: 1 }}
                >
                    <Typography level="body2">
                        {msg.isMedium
                            ? (msg.hasPerm
                                ? "Extension is fully active on this Medium site."
                                : "Medium detected but permissions are needed.")
                            : "This site is not a Medium publication."
                        }
                    </Typography>
                </Alert>


            </Box>
        </Box>
    );
}
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
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import FormHelperText from '@mui/joy/FormHelperText';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';

export default function status() {
    const [msg, setMsg] = React.useState(null);

    // Use the theme manager hook - ALL theme logic is here
    const themeManager = useTheme('primary', 'solid');

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

    const handler = async (msg) => {
        try {
            if (msg?.type === "URL_PERMISSION_STATUS") {

                const [result, value] = await Promise.all([
                    chrome.storage.local.get("BulkFollowArguments"),
                    chrome.storage.local.get("on_off_Controler")
                ])

                if (result.BulkFollowArguments) {
                    msg.upperLimit = result.BulkFollowArguments.upperLimit;
                    msg.lowerLimit = result.BulkFollowArguments.lowerLimit;
                } else {
                    await chrome.storage.local.set({
                        BulkFollowArguments: { upperLimit: 125, lowerLimit: 100 }
                    });
                    msg.upperLimit = 125;
                    msg.lowerLimit = 100;
                }

                if (!value.on_off_Controler) {
                    await chrome.storage.local.set({
                        on_off_Controler: { indector: "stop" }
                    });
                    msg.indector = "stop";
                } else {
                    msg.indector = value.on_off_Controler.indector;
                }

                msg.status = "set";
                setMsg(msg);
                console.log("Permission status:", msg);
            }
        } catch (error) {
            console.error("Error in handler:", error);
        }
    };

    const manageLimits = async () => {

        const reloadPage = () => {
            window.location.reload();
        }

        try {

            msg.indector = msg.indector === "stop" ? "start" : "stop";

            await chrome.storage.local.set({ BulkFollowArguments: { upperLimit: msg.upperLimit, lowerLimit: msg.lowerLimit } });
            await chrome.storage.local.set({ on_off_Controler: { indector: msg.indector } })

            await chrome.scripting.executeScript({
                target: { tabId: msg.tabId },
                func: reloadPage
            })

            window.location.reload();

        } catch (err) {
            console.error("error seting th elimits", err);
        }

    }

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
                                        overflowY: "hidden",
                                        height: "1.3rem",
                                        wordBreak: 'break-all',
                                        fontFamily: 'monospace',
                                        p: 1,
                                        borderRadius: 'sm',
                                        bgcolor: themeManager.isSolid ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                                        ...themeManager.getTextColor()
                                    }}
                                    title={msg.url}
                                >
                                    {msg.url}
                                </Typography>
                            </Box>

                            <FormControl sx={{ mt: "auto" }} >
                                <FormLabel invertedColors sx={{ ...themeManager.getTextColor(), fontSize: ".6rem" }}>
                                    Lower Limit - Upper Limit
                                </FormLabel>
                                <Input
                                    startDecorator={
                                        <Input
                                            sx={{ opacity: 0.8, ...themeManager.getTextColor(), fontSize: ".7rem", px: 1, width: "120px" }}
                                            type="number"
                                            required
                                            placeholder='Lower Limit'
                                            value={msg.lowerLimit}
                                            invertedColors
                                            name='Lower Limit'
                                            onChange={(event) =>
                                                (Number(event.target.value) >= 10 && Number(event.target.value) < msg.upperLimit) && (
                                                    setMsg(prevState => ({
                                                        ...prevState,
                                                        lowerLimit: Number(event.target.value)
                                                    }))
                                                )
                                            }
                                            error={msg.status === "error"}
                                        />
                                    }
                                    sx={{ '--Input-decoratorChildHeight': 'inherit', opacity: 0.8, ...themeManager.getTextColor(), fontSize: ".7rem", p: "0%", width: "280px", overflow: "hidden" }}
                                    type="number"
                                    placeholder='Upper Limit'
                                    required
                                    invertedColors
                                    value={msg.upperLimit}
                                    name='Upper Limit'
                                    onChange={(event) =>
                                        (Number(event.target.value) > msg.lowerLimit && Number(event.target.value) <= 150) && (
                                            setMsg(prevState => ({
                                                ...prevState,
                                                upperLimit: Number(event.target.value)
                                            }))
                                        )
                                    }
                                    error={msg.status === "error"}
                                    endDecorator={
                                        <Button
                                            variant="solid"
                                            color="primary"
                                            loading={msg.status != "set"}
                                            invertedColors
                                            onClick={() => manageLimits()}
                                            sx={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                        >
                                            Done
                                        </Button>
                                    }
                                />
                                {msg.status === 'error' && (
                                    <FormHelperText
                                        color="danger"
                                        invertedColors
                                    >
                                        Oops! something went wrong, please try again later.
                                    </FormHelperText>
                                )}
                            </FormControl>

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

                <Box sx={{ my: "auto", display: "flex", justifyContent: "center" }}>
                    <Button sx={{ px: 3 }} onClick={() => manageLimits()} >
                        {msg.indector === "stop" ? "start" : "stop"}
                    </Button>
                </Box>

            </Box>
        </Box>
    );
}
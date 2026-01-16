import { Box, Card, CardContent, CardOverflow, Stack } from "@mui/joy";
import Typography from "@mui/material/Typography";
import React from "react";
import { useTheme } from "./theme/ThemeContext";

export default function Follow() {
    const [data, setData] = React.useState(null);

    const themeManager = useTheme('primary', 'solid');

    // Load chrome storage data
    React.useEffect(() => {
        chrome.storage.local.get("ArticalData", (result) => {
            setData(result?.ArticalData?.items);
        });
    }, []);

    return (
        <Box sx={{
            width: "auto",
            height: "inherit",
            overflowY: "scroll",
            msScrollbarTrackColor: "transparent",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
        }}

            style={{ msScrollbarTrackColor: "transparent" }}

        >
            <div style={{ padding: "10px" }}>
                {/* Current Article Section */}
                <Box >
                    <Typography
                        variant="h6"
                        invertedColors
                        sx={{
                            ...themeManager.getTextColor(),
                            mb: 2,
                            fontWeight: "bold",
                            fontSize: ".7rem"
                        }}
                    >
                        Current Article's Author
                    </Typography>

                    {data && data.length > 0 ? (
                        <Stack direction="column" spacing={1} sx={{ width: "auto" }}>
                            {data.map((value, index) => (
                                <Card
                                    orientation="horizontal"
                                    variant={themeManager.isSolid ? 'solid' : 'soft'}
                                    color={themeManager.color}
                                    invertedColors
                                    sx={{ ...themeManager.getTextColor() , overflow: 'hidden' }}
                                    key={index}
                                >
                                    <CardOverflow sx={{ padding: 0 }} >
                                        <img
                                            src={value.Auther?.AutherImage}
                                            alt={`Profile picture of ${value.Auther?.AutherName}`}
                                            loading="lazy"
                                            decoding="async"
                                            style={{ objectFit: 'cover', height: "100%", width: 90 }}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://cdn.pixabay.com/photo/2024/07/27/14/45/writer-8925722_1280.png';
                                            }}
                                        />
                                    </CardOverflow>
                                    <CardContent sx={{ flexGrow: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontWeight: 'md', fontSize: "sm", color: "success.plainColor" }}>
                                            {value.Auther?.AutherName || 'Unknown Author'}
                                        </Typography>
                                        <Typography level="body-sm" sx={{ fontSize: ".6rem" }}>
                                            Reading time: {value.Artical?.ArticalReadTime || 'N/A'}
                                        </Typography>
                                        <Typography level="body-sm" sx={{ fontSize: ".6rem" }}>
                                            Published: {value.Artical?.ArticalDate || 'No date'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    ) : (
                        <Typography variant="body1" sx={{ color: "text.secondary" }}>
                            No current article data available.
                        </Typography>
                    )}
                </Box>
            </div>
        </Box>
    );
}
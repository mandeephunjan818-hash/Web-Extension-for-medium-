import { Box, Card, CardContent, CardOverflow, Stack } from "@mui/joy";
import Typography from "@mui/material/Typography";
import React from "react";
import { useTheme } from "./theme/ThemeContext";
import { LinearProgress } from "@mui/joy";

export default function Follow() {
    const [data, setData] = React.useState(null);
    const [followStats, setFollowStats] = React.useState({
        todayCount: 0,
        todayDate: null,
        lowerLimit: 0,
        upperLimit: 0
    });
    const [timeRemaining, setTimeRemaining] = React.useState("");

    const themeManager = useTheme('primary', 'solid');

    // Load chrome storage data
    React.useEffect(() => {
        chrome.storage.local.get("ArticalData", (result) => {
            setData(result?.ArticalData?.items);
        });
        
        // Load follow limits and today's followers
        chrome.storage.local.get(["BulkFollowArguments", "Todays_Followers"], (result) => {
            const todayStats = result?.Todays_Followers || { count: 0, date_time: new Date().toISOString() };
            const followArgs = result?.BulkFollowArguments || { upperLimit: 0, lowerLimit: 0 };
            
            setFollowStats({
                todayCount: todayStats.count || 0,
                todayDate: todayStats.date_time || new Date().toISOString(),
                lowerLimit: followArgs.lowerLimit || 0,
                upperLimit: followArgs.upperLimit || 0
            });
        });
    }, []);

    // Calculate time until reset (24 hours from stored date)
    React.useEffect(() => {
        const calculateTimeRemaining = () => {
            if (!followStats.todayDate) return;
            
            const storedDate = new Date(followStats.todayDate);
            const resetTime = new Date(storedDate.getTime() + 24 * 60 * 60 * 1000);
            const now = new Date();
            
            const diffMs = resetTime - now;
            
            if (diffMs <= 0) {
                setTimeRemaining("Resets now!");
                return;
            }
            
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            
            setTimeRemaining(`${hours}h ${minutes}m`);
        };
        
        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute
        
        return () => clearInterval(interval);
    }, [followStats.todayDate]);

    // Calculate progress percentage
    const calculateProgress = () => {
        if (followStats.upperLimit <= followStats.lowerLimit) return 0;
        
        const totalRange = followStats.upperLimit - followStats.lowerLimit;
        const progress = followStats.todayCount - followStats.lowerLimit;
        
        return Math.min(Math.max((progress / totalRange) * 100, 0), 100);
    };

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
                
                {/* New: Daily Follow Limit Progress Section */}
                <Box sx={{ mb: 3 }}>
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
                        Daily Follow Progress
                    </Typography>
                    
                    <Card
                        variant={themeManager.isSolid ? 'solid' : 'soft'}
                        color={themeManager.color}
                        invertedColors
                        sx={{ ...themeManager.getTextColor(), overflow: 'hidden' }}
                    >
                        <CardContent>
                            {/* Progress Bar */}
                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography level="body-xs" sx={{ fontSize: ".6rem" }}>
                                        Follows Today: {followStats.todayCount}
                                    </Typography>
                                    <Typography level="body-xs" sx={{ fontSize: ".6rem" }}>
                                        {followStats.lowerLimit} - {followStats.upperLimit}
                                    </Typography>
                                </Box>
                                
                                <LinearProgress
                                    determinate
                                    value={calculateProgress()}
                                    sx={{
                                        height: 8,
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: followStats.todayCount >= followStats.upperLimit ? '#f44336' : '#4caf50'
                                        }
                                    }}
                                />
                                
                                <Typography level="body-xs" sx={{ mt: 1, fontSize: ".6rem", textAlign: 'center' }}>
                                    {followStats.todayCount >= followStats.upperLimit 
                                        ? '✅ Daily limit reached' 
                                        : `${followStats.upperLimit - followStats.todayCount} follows remaining`}
                                </Typography>
                            </Box>
                            
                            {/* Timer until reset */}
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                pt: 1,
                                borderTop: '1px solid',
                                borderColor: 'divider'
                            }}>
                                <Typography level="body-xs" sx={{ fontSize: ".6rem" }}>
                                    Resets in: 
                                </Typography>
                                <Typography 
                                    level="body-xs" 
                                    sx={{ 
                                        fontSize: ".6rem",
                                        fontWeight: 'bold',
                                        color: timeRemaining === "Resets now!" ? '#ff9800' : 'inherit'
                                    }}
                                >
                                    {timeRemaining || "Calculating..."}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* Existing: Current Article Section */}
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
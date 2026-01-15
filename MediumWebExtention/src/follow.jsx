import { AspectRatio, Box, Button, Card, CardActions, CardContent, CardOverflow, Divider, IconButton, Stack } from "@mui/joy";
import Typography from "@mui/material/Typography";
import React from "react";
import { useTheme } from "./theme/ThemeContext";

export default function Follow() {
    const [data, setData] = React.useState(null);
    const [dbData, setDbData] = React.useState({
        authors: [],
        articles: [],
        events: [],
        loading: true,
        error: null
    });
    const themeManager = useTheme('primary', 'solid');

    // Load chrome storage data
    React.useEffect(() => {
        chrome.storage.local.get("ArticalData", (result) => {
            setData(result?.ArticalData?.items);
        });
    }, []);

    // Load database data using chrome.runtime API
    React.useEffect(() => {
        async function loadDBData() {
            try {
                if (!chrome.runtime?.id) {
                    throw new Error('Extension context invalidated');
                }

                const response = await chrome.runtime.sendMessage({
                    action: 'getDatabaseData'
                });

                if (chrome.runtime.lastError) {
                    throw new Error(chrome.runtime.lastError.message);
                }

                if (response && !response.error) {

                    setDbData({
                        authors: response.authors || [],
                        articles: response.articles || [],
                        events: response.events || [],
                        loading: false,
                        error: null
                    });
                } else {
                    throw new Error(response?.error || 'Failed to load data');
                }
            } catch (error) {
                console.error("Error loading database data:", error);
                setDbData(prev => ({
                    ...prev,
                    loading: false,
                    error: error.message
                }));
            }
        }

        loadDBData();
    }, []);

    // Get articles by current author using events
    const getAuthorArticles = React.useMemo(() => {
        if (!data || !data[0] || !dbData.events.length || !dbData.articles.length) return [];

        const currentAuthorUrl = data[0]?.Auther?.AutherUrl;
        if (!currentAuthorUrl) return [];

        // Find all article URLs for this author from events
        const authorArticleUrls = dbData.events
            .filter(event => event.AuthorUrl === currentAuthorUrl)
            .map(event => event.ArticalUrl);

        // Create a Set for faster lookup
        const authorArticleUrlSet = new Set(authorArticleUrls);

        // Get full article data for these URLs
        const articles = dbData.articles.filter(article =>
            authorArticleUrlSet.has(article.ArticalUrl)
        );

        return articles;
    }, [data, dbData.events, dbData.articles]);

    // Get recent articles (excluding current author's) using events
    const getRecentArticles = React.useMemo(() => {
        if (!dbData.events.length || !dbData.articles.length || !dbData.authors.length) return [];

        const currentAuthorUrl = data?.[0]?.Auther?.AutherUrl;

        // Create maps for quick lookup
        const authorMap = new Map();
        dbData.authors.forEach(author => {
            authorMap.set(author.AutherUrl, author);
        });

        const articleMap = new Map();
        dbData.articles.forEach(article => {
            articleMap.set(article.ArticalUrl, article);
        });

        // Get recent events excluding current author
        const recentEvents = dbData.events
            .filter(event => event.AuthorUrl !== currentAuthorUrl)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        // Build enriched articles from events
        const enrichedArticles = recentEvents.map(event => {
            const article = articleMap.get(event.ArticalUrl);
            const author = authorMap.get(event.AuthorUrl);

            if (!article) return null; // Skip if article not found

            return {
                ArticalUrl: article.ArticalUrl,
                ArticalTitle: article.ArticalTitle,
                ArticalReadTime: article.ArticalReadTime,
                ArticalDate: article.ArticalDate,
                visitCount: article.visitCount,
                AuthorName: author?.AutherName || 'Unknown',
                AuthorImage: author?.AutherImage || '',
                eventTimestamp: event.timestamp
            };
        }).filter(article => article !== null); // Remove any nulls

        return enrichedArticles;
    }, [dbData.events, dbData.articles, dbData.authors, data]);

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
                                    sx={{ ...themeManager.getTextColor() }}
                                    key={index}
                                >
                                    <CardOverflow>
                                        <AspectRatio ratio="1" sx={{ width: 90 }}>
                                            <img
                                                src={value.Auther?.AutherImage}
                                                alt={`Profile picture of ${value.Auther?.AutherName}`}
                                                loading="lazy"
                                                decoding="async"
                                                style={{ objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://cdn.pixabay.com/photo/2024/07/27/14/45/writer-8925722_1280.png';
                                                }}
                                            />
                                        </AspectRatio>
                                    </CardOverflow>
                                    <CardContent sx={{ flexGrow: 1 }}>
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

                {/* Divider */}
                <Divider sx={{ my: 2 }}>
                    <Typography
                        variant="caption"
                        invertedColors
                        sx={{
                            ...themeManager.getTextColor(),
                            px: 2,
                            backgroundColor: themeManager.isSolid ? "primary.500" : "background.body",
                        }}
                    >
                        Database Records
                    </Typography>
                </Divider>

                {/* Author's Articles from Database */}
                {data && data[0] && (
                    <Box>
                        {dbData.loading ? (
                            <Typography variant="body2" invertedColors sx={{ ...themeManager.getTextColor() }}>
                                Loading author articles...
                            </Typography>
                        ) : getAuthorArticles.length > 0 ? (
                            <Stack direction="column" spacing={1}>
                                {getAuthorArticles.slice(0, 5).map((article, index) => (
                                    <Card
                                        variant="outlined"
                                        invertedColors
                                        sx={[
                                            {
                                                ...themeManager.getTextColor(),
                                                width: "auto",
                                                // to make the card resizable
                                                overflow: 'auto',
                                                resize: 'horizontal',
                                            },
                                            themeManager.getBgColor()
                                        ]}

                                        key={index}
                                    >
                                        <CardContent>
                                            <Typography level="title-lg" sx={{ fontSize: ".6rem" }} >{data[0]?.Auther?.AutherName || 'Unknown Author'}</Typography>
                                            <Typography level="body-sm">
                                                {article?.ArticalTitle || 'Untitled Article'}
                                            </Typography>
                                        </CardContent>
                                        <CardActions buttonFlex="0 1 120px">
                                            <IconButton variant="outlined" color="neutral" sx={{ mr: 'auto', fontSize: ".6rem" }}>
                                                {article?.visitCount || 0} Visits
                                            </IconButton>
                                            <Button variant="outlined" color="neutral" sx={{ fontSize: ".6rem" }} >
                                                {article?.ArticalReadTime || 'N/A'}
                                            </Button>
                                            <Button variant="solid" color="primary" sx={{ fontSize: ".6rem" }}>
                                                {article?.ArticalDate || 'No date'}
                                            </Button>
                                        </CardActions>
                                    </Card>
                                ))}
                            </Stack>
                        ) : (
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                No articles found for this author in database
                            </Typography>
                        )}
                    </Box>
                )}

                {/* Recent Articles from Database */}
                {getRecentArticles.length > 0 && (
                    <Box>
                        <Typography
                            variant="h6"
                            invertedColors
                            sx={{
                                ...themeManager.getTextColor(),
                                mb: 2,
                                fontWeight: "bold",
                            }}
                        >
                            Recent Articles
                        </Typography>

                        {dbData.loading ? (
                            <Typography variant="body2" invertedColors sx={{ ...themeManager.getTextColor() }}>
                                Loading recent articles...
                            </Typography>
                        ) : (
                            <Stack direction="column" spacing={1}>
                                {getRecentArticles.map((article, index) => {
                                    console.log(`Rendering recent article ${index}:`, article);

                                    // Safety check - ensure all values are primitives
                                    const safeArticle = {
                                        title: String(article?.ArticalTitle || 'Untitled'),
                                        author: String(article?.AuthorName || 'Unknown'),
                                        readTime: String(article?.ArticalReadTime || 'N/A'),
                                        visits: Number(article?.visitCount || 0),
                                        url: String(article?.ArticalUrl || '')
                                    };

                                    return (
                                        <Card
                                            variant="outlined"
                                            invertedColors
                                            sx={[
                                                {
                                                    ...themeManager.getTextColor(),
                                                    width: "auto",
                                                    // to make the card resizable
                                                    overflow: 'auto',
                                                    resize: 'horizontal',
                                                },
                                                themeManager.getBgColor()
                                            ]}
                                        >
                                            <CardContent>
                                                <Typography level="title-lg" sx={{ fontSize: ".6rem" }} >{safeArticle?.author || 'Unknown Author'}</Typography>
                                                <Typography level="body-sm">
                                                    {safeArticle?.title || 'Untitled Article'}
                                                </Typography>
                                            </CardContent>
                                            <CardActions buttonFlex="0 1 120px">
                                                <IconButton variant="outlined" color="neutral" sx={{ mr: 'auto', fontSize: ".6rem" }}>
                                                    {safeArticle?.visits || 0} Visits
                                                </IconButton>
                                                <Button variant="outlined" color="neutral" sx={{ fontSize: ".6rem" }} >
                                                    {safeArticle?.readTime || 'N/A'}
                                                </Button>
                                            </CardActions>
                                        </Card>
                                    );
                                })}
                            </Stack>
                        )}
                    </Box>
                )}
            </div>
        </Box>
    );
}
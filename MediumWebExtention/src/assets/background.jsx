import { Box, Sheet } from "@mui/joy";
import { useTheme } from "../theme/ThemeContext";


export default function Background({ children }) {

    const themeManager = useTheme('primary', 'solid');

    return (
        <Sheet
            variant={themeManager.isSolid ? 'solid' : 'soft'}
            color={themeManager.color}
            invertedColors
            sx={[
                {
                    flexGrow: 1,
                    height: "inherit",
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'clip',
                    '&::after': {
                        content: `""`,
                        display: 'block',
                        width: '30rem',
                        height: '80rem',
                        background: `linear-gradient(to top, ${themeManager.getGradients().gradient1}, ${themeManager.getGradients().gradient2})`,
                        position: 'absolute',
                        transform: 'rotate(50deg)',
                        top: '10%',
                        right: '0%',
                        zIndex: 0,
                    },
                },
                themeManager.getBgColor(), // Using the bgColor from theme manager
            ]}
        >
            <Box sx={{ position: 'relative', zIndex: 1, flexGrow: 1, height: "inherit" }}>
                {children}
            </Box>
        </Sheet>
    );
}
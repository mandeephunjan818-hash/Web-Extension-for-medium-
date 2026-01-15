import Sheet from "@mui/joy/Sheet";
import { ThemeChangerColour, ThemeChangerVariant } from "./theme/ThemeChanger";
import { useTheme } from "./theme/ThemeContext";
import BlurCircularIcon from '@mui/icons-material/BlurCircular';
import CameraIcon from '@mui/icons-material/Camera';
import { IconButton } from "@mui/joy";

export default function Nav(data) {

    const themeManager = useTheme('primary', 'solid');

    const textColor = themeManager.getTextColor();

    return (
        <Sheet
            variant="solid"
            invertedColors
            sx={{
                p: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                width: "20px",
                bgcolor: `${themeManager.color}.800`,
                '& button': {
                    borderRadius: '50%',
                    padding: 0,
                    '--IconButton-size': '1.5rem',
                },
            }}
        >
            <IconButton
                variant={themeManager.isSolid ? 'soft' : 'solid'}
                onClick={() => data.changePage(1)}
                sx={[{ ...textColor, mb: 1 , border:"1px solid" }, data.currentPage === 1 ? { borderColor:"springgreen" } : { borderColor:"transparent" }]}
                title="Status"

            >
                <BlurCircularIcon sx={{ fontSize: "1.8rem" }} />
            </IconButton>

            <IconButton
                variant={themeManager.isSolid ? 'soft' : 'solid'}
                onClick={() => data.changePage(2)}
                sx={[{ ...textColor, mb: 1 , border:"1px solid" }, data.currentPage === 2 ? { borderColor:"springgreen" } : { borderColor:"transparent" }]}
                title="Status"

            >
                <CameraIcon sx={{ fontSize: "1.8rem" }} />
            </IconButton>


            <ThemeChangerVariant
                themeManager={themeManager}
                textColor={textColor}
            />
            <ThemeChangerColour
                themeManager={themeManager}
                textColor={textColor}
            />
        </Sheet>
    )
}
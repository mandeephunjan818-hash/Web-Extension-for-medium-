// ThemeChanger.jsx
import * as React from 'react';
import { useTheme } from '@mui/joy/styles';
import IconButton from '@mui/joy/IconButton';
import ColorLensRoundedIcon from '@mui/icons-material/ColorLensRounded';
import InvertColorsIcon from '@mui/icons-material/InvertColors';
import { availableColors, availableVariants } from './theme';

// Custom hook that contains ALL theme logic
export function useThemeManager(initialColor = 'primary', initialVariant = 'solid') {
    const [color, setColor] = React.useState(initialColor);
    const [variant, setVariant] = React.useState(initialVariant);
    const theme = useTheme();

    // Check if variant is solid
    const isSolid = variant === 'solid';

    // Color calculation functions
    const shade = (x) => theme.vars.palette[color][x];
    const getColor1 = () => (isSolid ? shade(800) : shade(600));
    const getColor2 = () => (isSolid ? shade(600) : shade(200));
    const getColor3 = () => shade(900);

    // Get gradients
    const getGradients = () => {
        const color1 = getColor1();
        const color2 = getColor2();
        const color3 = getColor3();
        return {
            gradient1: `${color1}, ${color2} 65%`,
            gradient2: `${color1} 65%, ${color3}`,
        };
    };

    // Get text color
    const getTextColor = () => ({
        color: isSolid ? shade(50) : shade(700)
    });

    // Get background color
    const getBgColor = () => ({
        bgcolor: isSolid ? shade(800) : shade(100)
    });

    // Change color to next in list
    const nextColor = () => {
        const nextIndex = (availableColors.indexOf(color) + 1) % availableColors.length;
        setColor(availableColors[nextIndex]);
    };

    // Toggle variant between solid/soft
    const toggleVariant = () => {
        setVariant(current => current === 'solid' ? 'soft' : 'solid');
    };

    // Set specific color
    const setSpecificColor = (newColor) => {
        if (availableColors.includes(newColor)) {
            setColor(newColor);
        }
    };

    // Set specific variant
    const setSpecificVariant = (newVariant) => {
        if (availableVariants.includes(newVariant)) {
            setVariant(newVariant);
        }
    };

    return {
        // State
        color,
        variant,
        isSolid,

        // Actions
        nextColor,
        toggleVariant,
        setSpecificColor,
        setSpecificVariant,

        // Style getters
        getGradients,
        getTextColor,
        getBgColor,
        shade,
    };
}

// UI Component that uses the theme manager
export function ThemeChangerColour({ themeManager, textColor }) {
    const { nextColor } = themeManager;

    return (

        <IconButton
            variant={themeManager.isSolid ? 'soft' : 'solid'}
            onClick={nextColor}
            sx={{ ...textColor }}
            title="Change theme color"
        >
            <ColorLensRoundedIcon sx={{ fontSize: "1.8rem" }} />
        </IconButton>

    );
}

export function ThemeChangerVariant({ themeManager, textColor }) {
    const { toggleVariant } = themeManager;

    return (
        <IconButton
            variant={themeManager.isSolid ? 'soft' : 'solid'}
            onClick={toggleVariant}
            sx={{ ...textColor, marginTop: "auto" }}
            title="Toggle solid/soft variant"
        >
            <InvertColorsIcon sx={{ fontSize: "1.8rem" }} />
        </IconButton>
    )
}
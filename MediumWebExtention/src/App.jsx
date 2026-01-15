import Status from './status';
import Nav from './nav';
import Box from '@mui/joy/Box';
import { ThemeProvider } from './theme/ThemeContext';
import { useState } from 'react';
import Follow from './follow';
import Background from './assets/background';

export default function App() {

  const [currentPage, setCurrentPage] = useState(1);

  const renderContent = () => {
    switch (currentPage) {
      case 1:
        return <Status />;
      case 2:
        return <Follow />;
      default:
        return <Status />;
    }
  };

  return (
    <ThemeProvider>
      <Box sx={{ display: "flex", justifyContent: "center", width: '350px', height: "600px" }} >

        <Background children={renderContent()} />

        <Nav currentPage={currentPage} changePage={setCurrentPage} />
      </Box>
    </ThemeProvider>
  );
}
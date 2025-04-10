import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Flex, Text, Badge, HStack, VStack, IconButton, Menu, MenuButton, MenuList, MenuItem, MenuDivider, Portal } from '@chakra-ui/react';
import { ChevronDownIcon, CloseIcon } from '@chakra-ui/icons';
import { useFilterContext } from '../context/FilterContext';

export const MonthFilter = () => {
  const { 
    selectedMonths, 
    setSelectedMonths,
    availableMonths,
    setAvailableMonths
  } = useFilterContext();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Lista fija de meses del año para demostración
  useEffect(() => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    setAvailableMonths(months);
  }, [setAvailableMonths]);

  // Manejador para cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Manejador para selección de meses
  const handleMonthSelection = (month) => {
    if (selectedMonths.includes(month)) {
      setSelectedMonths(selectedMonths.filter(m => m !== month));
    } else {
      setSelectedMonths([...selectedMonths, month]);
    }
  };

  // Limpiar selección
  const clearSelection = () => {
    setSelectedMonths([]);
  };

  return (
    <Box position="relative" ref={dropdownRef}>
      <Menu isOpen={isOpen}>
        <MenuButton 
          as={Button}
          rightIcon={<ChevronDownIcon />}
          onClick={() => setIsOpen(!isOpen)}
          size="sm"
          variant="outline"
          width="180px"
        >
          {selectedMonths.length === 0 
            ? 'Select Months' 
            : `${selectedMonths.length} Month${selectedMonths.length > 1 ? 's' : ''}`}
        </MenuButton>
        
        <Portal>
          <MenuList minWidth="200px" zIndex={1000}>
            {availableMonths.map((month) => (
              <MenuItem 
                key={month} 
                onClick={() => handleMonthSelection(month)}
                bg={selectedMonths.includes(month) ? "blue.50" : "transparent"}
              >
                <Flex justify="space-between" width="100%">
                  <Text>{month}</Text>
                  {selectedMonths.includes(month) && (
                    <Badge colorScheme="blue">Selected</Badge>
                  )}
                </Flex>
              </MenuItem>
            ))}
            <MenuDivider />
            <MenuItem onClick={clearSelection} color="red.500">
              Clear Selection
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>
      
      {selectedMonths.length > 0 && (
        <Box mt={2}>
          <Flex wrap="wrap" gap={2}>
            {selectedMonths.map((month) => (
              <Badge 
                key={month} 
                colorScheme="blue" 
                borderRadius="full" 
                px={2} 
                py={1}
              >
                <Flex align="center">
                  <Text fontSize="xs">{month}</Text>
                  <IconButton
                    icon={<CloseIcon />}
                    size="xs"
                    variant="ghost"
                    ml={1}
                    onClick={() => handleMonthSelection(month)}
                    aria-label={`Remove ${month}`}
                  />
                </Flex>
              </Badge>
            ))}
          </Flex>
        </Box>
      )}
    </Box>
  );
}; 
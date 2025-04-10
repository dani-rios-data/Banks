import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Flex, Text, Badge, IconButton, Menu, MenuButton, MenuList, MenuItem, MenuDivider, Portal } from '@chakra-ui/react';
import { ChevronDownIcon, CloseIcon } from '@chakra-ui/icons';
import { useFilterContext } from '../context/FilterContext';
import { enhancedBankColors } from '../utils/bankColors';

export const BankSelector = () => {
  const { 
    selectedBanks, 
    setSelectedBanks,
    availableBanks,
    setAvailableBanks
  } = useFilterContext();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar el dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Función para manejar cambios en la selección de bancos
  const handleBankSelection = (bank) => {
    if (bank === 'All') {
      setSelectedBanks(['All']);
    } else {
      const newSelection = selectedBanks.includes('All') 
        ? [bank]
        : selectedBanks.includes(bank)
          ? selectedBanks.filter(b => b !== bank)
          : [...selectedBanks, bank];
      
      setSelectedBanks(newSelection.length === 0 ? ['All'] : newSelection);
    }
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
          {selectedBanks.includes('All') 
            ? 'All Banks' 
            : `${selectedBanks.length} Bank${selectedBanks.length > 1 ? 's' : ''}`}
        </MenuButton>
        
        <Portal>
          <MenuList minWidth="200px" zIndex={1000}>
            <MenuItem 
              onClick={() => handleBankSelection('All')}
              bg={selectedBanks.includes('All') ? "blue.50" : "transparent"}
            >
              <Flex justify="space-between" width="100%">
                <Text>All Banks</Text>
                {selectedBanks.includes('All') && (
                  <Badge colorScheme="blue">Selected</Badge>
                )}
              </Flex>
            </MenuItem>
            <MenuDivider />
            
            {availableBanks.filter(bank => bank !== 'All').map((bank) => (
              <MenuItem 
                key={bank} 
                onClick={() => handleBankSelection(bank)}
                bg={selectedBanks.includes(bank) ? "blue.50" : "transparent"}
              >
                <Flex justify="space-between" width="100%" align="center">
                  <Flex align="center">
                    <Box 
                      w="12px" 
                      h="12px" 
                      borderRadius="full" 
                      bg={enhancedBankColors[bank] || "#CBD5E0"} 
                      mr={2} 
                    />
                    <Text>{bank}</Text>
                  </Flex>
                  {selectedBanks.includes(bank) && (
                    <Badge colorScheme="blue">Selected</Badge>
                  )}
                </Flex>
              </MenuItem>
            ))}
          </MenuList>
        </Portal>
      </Menu>
      
      {!selectedBanks.includes('All') && selectedBanks.length > 0 && (
        <Box mt={2}>
          <Flex wrap="wrap" gap={2}>
            {selectedBanks.map((bank) => (
              <Badge 
                key={bank} 
                colorScheme="blue" 
                borderRadius="full" 
                px={2} 
                py={1}
              >
                <Flex align="center">
                  <Box 
                    w="8px" 
                    h="8px" 
                    borderRadius="full" 
                    bg={enhancedBankColors[bank] || "#CBD5E0"} 
                    mr={1} 
                  />
                  <Text fontSize="xs">{bank}</Text>
                  <IconButton
                    icon={<CloseIcon />}
                    size="xs"
                    variant="ghost"
                    ml={1}
                    onClick={() => handleBankSelection(bank)}
                    aria-label={`Remove ${bank}`}
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
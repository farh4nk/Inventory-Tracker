'use client'
import Image from "next/image";
import { useState, useEffect } from "react";
import { firestore } from '@/firebase';
import { Box, Typography, Modal, Stack, TextField, Button } from "@mui/material";
import { collection, setDoc, query, doc, getDoc, getDocs, deleteDoc } from "firebase/firestore";
let total = 0;
export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
     docs.forEach(doc => {
      inventoryList.push({
        name: doc.id,
        ...doc.data()
      })
     })
     setInventory(inventoryList);
  }

  const removeItem = async (item) => {
    total--;
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const {quantity} = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      }
      else {
        await setDoc(docRef, {quantity: quantity - 1})
      }
    }
    await updateInventory(); 
  }

  const addItem = async (item) => {
    total++;
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {

        const {quantity} = docSnap.data();
        await setDoc(docRef, {quantity: quantity + 1})
    }
    else {
      await setDoc(docRef, {quantity: 1});
    }
    await updateInventory(); 
  }

  const editInventoryItem = async (itemName, newQuantity) => {
    try {
      const docRef = doc(firestore, 'inventory', itemName);
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        await setDoc(docRef, { quantity: newQuantity });
  
        setInventory(prevInventory =>
          prevInventory.map(item =>
            item.name === itemName ? { name: itemName, quantity: newQuantity } : item
          )
        );
      } else {
        console.error("Document not found.");
      }
  
      handleEditClose();
    } catch (error) {
      console.error("Error editing item:", error);
    }
  };
  
  
  useEffect(() => {
    updateInventory() 
  }, [])

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleEditOpen = (item) => {
    setEditItem(item);
    setEditOpen(true);
  };
  const handleEditClose = () => setEditOpen(false);

  return(
    <Box width='100vw'
         height = '100vh'
         display="flex"
         flexDirection='column'
         justifyContent='center'
         alignItems='center'
         gap={2}
         >
          <Modal open={open} onClose={handleClose}>
            <Box
              position='absolute'
              top='50%' 
              left='50%'
              width={400}
              bgcolor='white'
              border='2px solid #000000'
              boxShadow={24}
              p={4}
              display='flex'
              flexDirection='column'
              gap={3}
              sx={{
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Typography variant='h6'>Add Item</Typography>
              <Stack width='100%' direction="row" spacing={2}>
                <TextField 
                variant='outlined'
                fullwidth
                value={itemName}
                onChange={(e) => {
                  setItemName(e.target.value)
                }}/>
                <Button
                variant="outlined"
                onClick={() => {
                  addItem(itemName)
                  setItemName('')
                  handleClose()
                }}>Add</Button>
              </Stack>
            </Box>
          </Modal>

          <Modal open={editOpen} onClose={handleEditClose}>
        <Box
          position='absolute'
          top='50%' 
          left='50%'
          width={400}
          bgcolor='white'
          border='2px solid #000000'
          boxShadow={24}
          p={4}
          display='flex'
          flexDirection='column'
          gap={3}
          sx={{ transform: 'translate(-50%, -50%)' }}
        >
          <Typography variant='h6'>Edit Item Quantity</Typography>
          <Stack width='100%' direction="column" spacing={2}>
            <TextField 
              variant='outlined'
              fullWidth
              type='number'
              value={editItem ? editItem.quantity : ''}
              onChange={(e) => setEditItem({...editItem, quantity: parseInt(e.target.value, 10)})}
            />
            <Button
              variant="outlined"
              onClick={() => {
                editInventoryItem(editItem.name, editItem.quantity);
              }}
            >
              Save
            </Button>
          </Stack>
        </Box>
      </Modal>

          <Button variant='contained'
          onClick={() => {
            handleOpen()
          }}>Add New Item</Button>

          <TextField 
                  variant='outlined'
                  placeholder='Search items...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
                  sx={{ margin: '10px 0', width: '300px' }}
                />


          <Box border='1px solid #333'>
            <Box width='800px'
                 height='100px'
                 bgcolor='#565ef5'
                 display='flex'
                 alignItems='center'
                 justifyContent='center'
                 >
              <Typography variant='h2' color='#ffffff'>
                Inventory Items
              </Typography>
            </Box>
          
          <Stack width='800px'
                height='300px'
                spacing={2}
                overflow='auto'
                >
                  {
                    inventory.filter(item => item.name.toLowerCase().includes(searchQuery))
                    .map(({name, quantity}) => (
                      <Box 
                        key={name} 
                        width='100%' 
                        minHeight='150px' 
                        display='flex'
                        alignItems='center' 
                        justifyContent='space-between' 
                        
                        padding={5}
                      >
                        <Typography variant='h3' color='#333' textAlign='center' fontWeight='100'>
                          {name.charAt(0).toUpperCase() + name.slice(1)}
                        </Typography>

                        <Typography variant='h3' color='#333' textAlign='center' fontWeight='100'>
                          {quantity}
                        </Typography>




                        <Stack direction='row' spacing={2}>
                        <Button variant='contained' 
                                onClick = {() => {
                                  addItem(name)
                                }}
                                >
                                  Add
                                </Button>
                        <Button variant='contained'
                                onClick = {() => {
                                  removeItem(name)
                                }}
                                >
                                  Remove
                                </Button>
                                <Button variant='contained' onClick={() => handleEditOpen({name, quantity})}>Edit</Button>
                                </Stack></Box>
                          
                      
                      
                    ))}
                </Stack>
              </Box>
              <Box>
        <Typography variant="h4">Total Items: {inventory.reduce((sum, item) => sum + item.quantity, 0)}</Typography>
      </Box>
            </Box>
            
   )
  }

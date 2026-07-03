import React from 'react'
import { motion } from 'framer-motion'
import ParentalLockButton from '../components/ParentalLockButton'

const Box = ({ i, onClick }) => (
  <motion.div
    className="w-full h-full flex items-center justify-center border border-black/60"
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
  >
    <motion.div
      className="rounded-lg bg-white/60 w-24 h-24"
      animate={{ scale: [0.8, 1.2, 0.8] }}
      transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror' }}
    />
  </motion.div>
)

export default function Enfoque({ onExit }) {
  const [toggle, setToggle] = React.useState(false)
  return (
    <div className="w-full h-full" style={{ background: '#f0f0f0' }}>
      <ParentalLockButton onExit={onExit} />
      <div className="grid grid-cols-2 h-full">
        {[0, 1, 2, 3].map(i => (
          <Box key={i} i={i} onClick={() => setToggle(t => !t)} />
        ))}
      </div>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs">Pulsa para alternar tamaño central</div>
    </div>
  )
}

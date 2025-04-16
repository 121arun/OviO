import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line as KonvaLine, Circle } from 'react-konva';
import { Box, IconButton, Tooltip, Paper, Divider, Slider, Popover } from '@mui/material';
import * as RiIcons from 'react-icons/ri';
import * as GiIcons from 'react-icons/gi';
import * as TbIcons from 'react-icons/tb';
import * as MdIcons from 'react-icons/md';

// Create typed versions of the icons
const RiEraserFill = RiIcons.RiEraserFill as React.FC;
const RiSaveLine = RiIcons.RiSaveLine as React.FC;
const GiFeather = GiIcons.GiFeather as React.FC;
const TbHandFinger = TbIcons.TbHandFinger as React.FC;
const TbArrowBackUp = TbIcons.TbArrowBackUp as React.FC;
const TbArrowForwardUp = TbIcons.TbArrowForwardUp as React.FC;
const TbZoomIn = TbIcons.TbZoomIn as React.FC;
const TbZoomOut = TbIcons.TbZoomOut as React.FC;
const MdOutlineCircle = MdIcons.MdOutlineCircle as React.FC;
const MdOutlineSquare = MdIcons.MdOutlineSquare as React.FC;

interface Point {
  x: number;
  y: number;
}

interface DrawingLine {
  id: string;
  tool: string;
  points: number[];
  color: string;
  strokeWidth: number;
}

const TOOLS = {
  PENCIL: { name: 'pencil', width: 2, color: '#2B2B2B' },
};

const COLORS = [
  '#2B2B2B', // Black
  '#FF3B7B', // Vibrant Pink
  '#00C2FF', // Electric Blue
  '#FFD600', // Bright Yellow
  '#4ADE80', // Spring Green
];

const BRUSH_SIZES = [2, 4, 6, 8, 12];

const App: React.FC = () => {
  const [lines, setLines] = useState<DrawingLine[]>([]);
  const [tool, setTool] = useState(TOOLS.PENCIL.name);
  const [color, setColor] = useState(TOOLS.PENCIL.color);
  const [isDrawing, setIsDrawing] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const stageRef = useRef<any>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [history, setHistory] = useState<DrawingLine[][]>([]);
  const [historyStep, setHistoryStep] = useState(0);
  const [pencilSize, setPencilSize] = useState(2);
  const [eraserSize, setEraserSize] = useState(2);
  const [showBrushSizes, setShowBrushSizes] = useState<HTMLElement | null>(null);
  const [showEraserSizes, setShowEraserSizes] = useState<HTMLElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Generate random sketch on component mount
  useEffect(() => {
    const generateRandomSketch = () => {
      const randomLines: DrawingLine[] = [];
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const baseSize = Math.min(window.innerWidth, window.innerHeight) * 0.2;

      // Add sketchy mountains in background
      const mountainRanges = [
        { baseY: centerY + baseSize * 0.3, height: baseSize * 0.35, peaks: 2 },
        { baseY: centerY + baseSize * 0.35, height: baseSize * 0.25, peaks: 3 }
      ];

      mountainRanges.forEach((range, rangeIndex) => {
        const mountainPoints = [];
        const segmentsPerPeak = 6;
        const totalPoints = range.peaks * segmentsPerPeak;
        const width = baseSize * 1.5; // Smaller, concentrated width
        const startX = centerX - width / 2;

        // Start from the left edge
        mountainPoints.push(startX, range.baseY);

        for (let i = 0; i <= totalPoints; i++) {
          const x = startX + (width * i) / totalPoints;
          const progress = i / segmentsPerPeak;
          const peakIndex = Math.floor(progress);
          const withinPeakProgress = progress - peakIndex;

          // Add natural variation to height
          const heightVariation = (Math.random() * 0.15 + 0.85) * range.height;
          
          // Create simpler mountain peaks
          let y;
          if (withinPeakProgress < 0.5) {
            // Going up - more linear
            y = range.baseY - withinPeakProgress * 2 * heightVariation;
          } else {
            // Going down - more linear
            y = range.baseY - (1 - withinPeakProgress) * 2 * heightVariation;
          }

          // Add subtle noise to make it look hand-drawn
          const noiseX = (Math.random() - 0.5) * 2;
          const noiseY = (Math.random() - 0.5) * 2;

          mountainPoints.push(x + noiseX, y + noiseY);
        }

        // End at the right edge
        mountainPoints.push(startX + width, range.baseY);

        randomLines.push({
          id: `mountain-range-${rangeIndex}`,
          tool: 'pencil',
          points: mountainPoints,
          color: COLORS[0],
          strokeWidth: 2
        });
      });

      // Sun with wobbly edges
      const sunX = centerX + baseSize * 0.8;
      const sunY = centerY - baseSize * 0.4;
      const sunRadius = baseSize * 0.15;
      const sunPoints = [];
      
      // Create wobbly sun outline
      for (let i = 0; i <= 32; i++) {
        const angle = (i / 32) * Math.PI * 2;
        const wobble = Math.random() * 5 - 2.5; // Random wobble between -2.5 and 2.5
        sunPoints.push(
          sunX + Math.cos(angle) * (sunRadius + wobble),
          sunY + Math.sin(angle) * (sunRadius + wobble)
        );
      }
      
      // Add sun
      randomLines.push({
        id: 'sun',
        tool: 'pencil',
        points: sunPoints,
        color: COLORS[0],
        strokeWidth: 2
      });

      // Add uneven sun rays
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const rayLength = sunRadius * (0.6 + Math.random() * 0.4); // Random ray length
        const wobbleX = Math.random() * 4 - 2;
        const wobbleY = Math.random() * 4 - 2;
        
        randomLines.push({
          id: `sun-ray-${i}`,
          tool: 'pencil',
          points: [
            sunX + Math.cos(angle) * sunRadius + wobbleX,
            sunY + Math.sin(angle) * sunRadius + wobbleY,
            sunX + Math.cos(angle) * (sunRadius + rayLength) + wobbleX,
            sunY + Math.sin(angle) * (sunRadius + rayLength) + wobbleY
          ],
          color: COLORS[0],
          strokeWidth: 2
        });
      }

      // Add sun face (slightly asymmetric smile)
      const smilePoints = [];
      for (let i = 0; i <= 16; i++) {
        const angle = Math.PI * 0.2 + (i / 16) * Math.PI * 0.6;
        const wobble = Math.random() * 3 - 1.5;
        smilePoints.push(
          sunX + Math.cos(angle) * (sunRadius * 0.5) + wobble,
          sunY + Math.sin(angle) * (sunRadius * 0.5) + sunRadius * 0.2 + wobble
        );
      }

      randomLines.push({
        id: 'sun-smile',
        tool: 'pencil',
        points: smilePoints,
        color: COLORS[0],
        strokeWidth: 2
      });

      // Add slightly uneven eyes
      randomLines.push({
        id: 'left-eye',
        tool: 'pencil',
        points: [
          sunX - sunRadius * 0.2, sunY - sunRadius * 0.2,
          sunX - sunRadius * 0.1, sunY - sunRadius * 0.2 + (Math.random() * 2 - 1)
        ],
        color: COLORS[0],
        strokeWidth: 2
      });

      randomLines.push({
        id: 'right-eye',
        tool: 'pencil',
        points: [
          sunX + sunRadius * 0.1, sunY - sunRadius * 0.2,
          sunX + sunRadius * 0.2, sunY - sunRadius * 0.2 + (Math.random() * 2 - 1)
        ],
        color: COLORS[0],
        strokeWidth: 2
      });

      // Add flowers with natural variation
      const flowerPositions = [
        { x: centerX - baseSize, y: centerY + baseSize * 0.4 },
        { x: centerX - baseSize * 0.3, y: centerY + baseSize * 0.5 },
        { x: centerX + baseSize * 0.4, y: centerY + baseSize * 0.45 }
      ];

      flowerPositions.forEach((pos, index) => {
        // Slightly curved stem
        const stemPoints = [];
        const stemHeight = baseSize * (0.2 + Math.random() * 0.1);
        const stemCurve = Math.random() * 10 - 5;
        
        for (let i = 0; i <= 8; i++) {
          const t = i / 8;
          stemPoints.push(
            pos.x + Math.sin(t * Math.PI) * stemCurve,
            pos.y - stemHeight * t
          );
        }

        randomLines.push({
          id: `flower-stem-${index}`,
          tool: 'pencil',
          points: stemPoints,
          color: COLORS[0],
          strokeWidth: 2
        });

        // Uneven flower petals
        const petalCount = 6 + Math.floor(Math.random() * 3);
        const flowerY = pos.y - stemHeight;
        
        for (let i = 0; i < petalCount; i++) {
          const angle = (i / petalCount) * Math.PI * 2;
          const petalLength = baseSize * (0.06 + Math.random() * 0.04);
          const wobbleX = Math.random() * 4 - 2;
          const wobbleY = Math.random() * 4 - 2;

          randomLines.push({
            id: `flower-petal-${index}-${i}`,
            tool: 'pencil',
            points: [
              pos.x + wobbleX, flowerY + wobbleY,
              pos.x + Math.cos(angle) * petalLength + wobbleX,
              flowerY + Math.sin(angle) * petalLength + wobbleY
            ],
            color: COLORS[0],
            strokeWidth: 2
          });
        }
      });

      setLines(randomLines);
      setHistory([randomLines]);
    };

    generateRandomSketch();
  }, []);

  useEffect(() => {
    const updateCursor = () => {
      const cursorSvg = `data:image/svg+xml,%3Csvg stroke='%23${color.slice(1)}' fill='%23${color.slice(1)}' stroke-width='0' viewBox='0 0 512 512' height='24' width='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M470.7 20L368.2 49.81l41.5-28.09c-26.2 5.92-59.3 17.5-100.9 36.19l-67.9 70.79L265 79.25c-23.3 12.96-48 29.95-71.8 49.85l-15.8 64.3-3.4-47.6c-23.5 21.6-45.6 45.6-63.9 70.9-19.23 26.5-34.26 54.5-41.79 82.4l-28.12-18.8c2.52 23.7 10.31 44.3 23.09 63.2l-33.62-10.3c7.64 23.5 20.13 38.7 41.25 51-11.83 33.3-17.38 68.1-23.34 102.8l18.4 3.1C87.31 277.4 237.9 141.8 374 81.72l6.9 17.38c-121.7 54.5-216.3 146.5-265.8 279.1 18.1.1 35.8-2.1 52.2-6.3l4.9-60.9 13.1 55.5c10.9-4 20.9-8.8 29.8-14.4l-20.7-43.5 32.8 34.8c8-6.4 14.6-13.6 19.6-21.5 30.4-47.5 62.2-94.7 124.8-134.2l-45.7-16.2 70.1 2.1c11.4-5.8 23.4-12.9 32.5-19.6l-49.7-4 74.7-17.6c5.8-5.8 11.2-11.9 16.1-18 17.3-21.94 29-44.78 26.2-65.55-1.3-10.39-7.5-20.16-17.6-25.63-2.5-1.3-5.2-2.45-7.5-3.22z'%3E%3C/path%3E%3C/svg%3E`;
      const canvas = document.querySelector('.konvajs-content') as HTMLElement;
      if (canvas && tool === 'pencil') {
        canvas.style.cursor = `url("${cursorSvg}") 0 24, crosshair`;
      }
    };

    updateCursor();
  }, [color, tool]);

  const getStrokeWidth = () => {
    switch (tool) {
      case 'pencil':
        return pencilSize / scale;
      case 'eraser':
        return eraserSize / scale;
      default:
        return 2 / scale;
    }
  };

  const getRelativePointerPosition = (stage: any) => {
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = stage.getPointerPosition();
    return transform.point(pos);
  };

  const handleMouseDown = (e: any) => {
    if (tool === 'pan') return;
    
    setIsDrawing(true);
    const stage = e.target.getStage();
    const point = getRelativePointerPosition(stage);
    
    const newLine: DrawingLine = {
      id: Date.now().toString(),
      tool,
      points: [point.x, point.y],
      color: color,
      strokeWidth: getStrokeWidth(),
    };
    setLines([...lines, newLine]);
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const point = getRelativePointerPosition(stage);
    setMousePos(point);

    if (!isDrawing) return;
    if (tool === 'pan') return;

    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Add to history
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push([...lines]);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    setScale(newScale);

    const newPos = {
      x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
      y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale
    };
    setPosition(newPos);
  };

  const handleUndo = () => {
    if (historyStep <= 0) return;
    const newStep = historyStep - 1;
    setHistoryStep(newStep);
    setLines([...history[newStep]]);
  };

  const handleRedo = () => {
    if (historyStep >= history.length - 1) return;
    const newStep = historyStep + 1;
    setHistoryStep(newStep);
    setLines([...history[newStep]]);
  };

  const handleClear = () => {
    setLines([]);
    setHistory([[]]);
    setHistoryStep(0);
  };

  const handleSave = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = 'sketch.png';
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: '#FAFAFA' }}
         data-tool={tool}
         data-color={color}
         className={isDragging ? 'dragging' : ''}>
      {/* Combined Toolbar */}
      <Paper
        elevation={3}
        className="toolbar"
        sx={{
          position: 'fixed',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          p: 1,
          borderRadius: 2,
          bgcolor: 'white',
          zIndex: 1000,
          '& .MuiIconButton-root': {
            padding: '6px !important',
            fontSize: '0.85rem',
          },
          '& .MuiSvgIcon-root': {
            fontSize: '1.2rem',
          },
        }}
      >
        {/* Drawing Tools */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Tooltip title="Pencil (P)" placement="right">
            <IconButton
              onClick={() => setTool('pencil')}
              className={tool === 'pencil' ? 'active' : ''}
              size="small"
              sx={{
                bgcolor: tool === 'pencil' ? 'rgba(0,0,0,0.08)' : 'transparent',
                transition: 'all 0.3s',
                '&:hover': {
                  bgcolor: 'rgba(255,182,193,0.2)',
                  transform: 'scale(1.1)',
                }
              }}
            >
              <GiFeather />
            </IconButton>
          </Tooltip>

          {/* Brush Size */}
          <Tooltip title="Brush Size" placement="right">
            <IconButton 
              onClick={(e) => setShowBrushSizes(e.currentTarget)}
              size="small"
              sx={{
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: pencilSize,
                  height: pencilSize,
                  borderRadius: '50%',
                  backgroundColor: color,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }
              }}
            >
              <MdOutlineCircle />
            </IconButton>
          </Tooltip>
          <Popover
            open={Boolean(showBrushSizes)}
            anchorEl={showBrushSizes}
            onClose={() => setShowBrushSizes(null)}
            anchorOrigin={{
              vertical: 'center',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'center',
              horizontal: 'left',
            }}
            sx={{
              '& .MuiPaper-root': {
                p: 2,
                borderRadius: 2,
              }
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1,
              minWidth: 200
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: 'text.secondary',
                fontSize: '0.8rem'
              }}>
                <MdOutlineCircle />
                <span>Brush Size</span>
              </Box>
              <Slider
                value={pencilSize}
                onChange={(_, value) => setPencilSize(value as number)}
                min={2}
                max={12}
                step={2}
                size="small"
                sx={{
                  '& .MuiSlider-thumb': {
                    width: pencilSize,
                    height: pencilSize,
                    backgroundColor: color,
                    '&:hover': {
                      boxShadow: '0 0 0 4px rgba(0,0,0,0.1)',
                    },
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: color,
                    opacity: 0.5,
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: 'rgba(0,0,0,0.1)',
                  },
                }}
              />
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '0.7rem',
                color: 'text.secondary'
              }}>
                <span>2</span>
                <span>12</span>
              </Box>
            </Box>
          </Popover>
        </Box>

        <Divider sx={{ my: 0.5 }} />

        {/* Utility Tools */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Tooltip title="Pan (Space)" placement="right">
            <IconButton
              onClick={() => setTool('pan')}
              className={tool === 'pan' ? 'active' : ''}
              size="small"
            >
              <TbHandFinger />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eraser (E)" placement="right">
            <IconButton
              onClick={() => setTool('eraser')}
              className={tool === 'eraser' ? 'active' : ''}
              size="small"
            >
              <RiEraserFill />
            </IconButton>
          </Tooltip>

          {/* Eraser Size */}
          <Tooltip title="Eraser Size" placement="right">
            <IconButton 
              onClick={(e) => setShowEraserSizes(e.currentTarget)}
              size="small"
              sx={{
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: eraserSize,
                  height: eraserSize,
                  border: '1px dashed #666',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }
              }}
            >
              <MdOutlineSquare />
            </IconButton>
          </Tooltip>
          <Popover
            open={Boolean(showEraserSizes)}
            anchorEl={showEraserSizes}
            onClose={() => setShowEraserSizes(null)}
            anchorOrigin={{
              vertical: 'center',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'center',
              horizontal: 'left',
            }}
            sx={{
              '& .MuiPaper-root': {
                p: 2,
                borderRadius: 2,
              }
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1,
              minWidth: 200
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: 'text.secondary',
                fontSize: '0.8rem'
              }}>
                <MdOutlineSquare />
                <span>Eraser Size</span>
              </Box>
              <Slider
                value={eraserSize}
                onChange={(_, value) => setEraserSize(value as number)}
                min={2}
                max={24}
                step={2}
                size="small"
                sx={{
                  '& .MuiSlider-thumb': {
                    width: eraserSize,
                    height: eraserSize,
                    backgroundColor: '#666',
                    border: '1px dashed #fff',
                    '&:hover': {
                      boxShadow: '0 0 0 4px rgba(0,0,0,0.1)',
                    },
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: '#666',
                    opacity: 0.5,
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: 'rgba(0,0,0,0.1)',
                  },
                }}
              />
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '0.7rem',
                color: 'text.secondary'
              }}>
                <span>2</span>
                <span>24</span>
              </Box>
            </Box>
          </Popover>
        </Box>

        <Divider sx={{ my: 0.5 }} />

        {/* Color Picker */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 0.2, 
          p: 0.2,
          width: '100%',
          alignItems: 'center'
        }}>
          {COLORS.map((c) => (
            <Tooltip key={c} title="Pick Color" placement="right">
              <IconButton
                size="small"
                sx={{
                  width: 24,
                  height: 24,
                  minWidth: '24px !important',
                  minHeight: '24px !important',
                  bgcolor: c,
                  border: color === c ? '1.5px solid #000' : '1.5px solid transparent',
                  borderRadius: '4px',
                  '&:hover': {
                    bgcolor: c,
                    transform: 'scale(1.1)',
                    boxShadow: '0 0 4px rgba(0,0,0,0.2)',
                  },
                  '&:active': {
                    transform: 'scale(1)',
                  }
                }}
                onClick={() => setColor(c)}
              />
            </Tooltip>
          ))}
        </Box>

        <Divider sx={{ my: 0.5 }} />

        {/* File Operations */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Tooltip title="Save (Ctrl+S)" placement="right">
            <IconButton onClick={handleSave} size="small">
              <RiSaveLine />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider sx={{ my: 0.5 }} />

        {/* History Controls */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Tooltip title="Undo (Ctrl+Z)" placement="right">
            <IconButton onClick={handleUndo} disabled={historyStep === 0} size="small">
              <TbArrowBackUp />
            </IconButton>
          </Tooltip>
          <Tooltip title="Redo (Ctrl+Y)" placement="right">
            <IconButton onClick={handleRedo} disabled={historyStep === history.length - 1} size="small">
              <TbArrowForwardUp />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Zoom Controls */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
          <Tooltip title="Zoom In (Ctrl++)" placement="right">
            <IconButton onClick={() => setScale(scale * 1.2)} size="small">
              <TbZoomIn />
            </IconButton>
          </Tooltip>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '0.7rem',
            color: 'text.secondary'
          }}>
            {Math.round(scale * 100)}%
          </Box>
          <Tooltip title="Zoom Out (Ctrl+-)" placement="right">
            <IconButton onClick={() => setScale(scale / 1.2)} size="small">
              <TbZoomOut />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onWheel={handleWheel}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={tool === 'pan'}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(e) => {
          setIsDragging(false);
          setPosition({
            x: e.target.x(),
            y: e.target.y()
          });
        }}
        style={{
          cursor: tool === 'eraser' ? 'none' : 'default',
        }}
        data-tool={tool}
        data-color={color}
      >
        <Layer>
          {lines.map((line, i) => (
            <KonvaLine
              key={i}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.strokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                line.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          ))}
        </Layer>
        {tool === 'eraser' && (
          <Layer listening={false}>
            <Circle
              x={mousePos.x}
              y={mousePos.y}
              radius={eraserSize / (2 * scale)}
              stroke="#666"
              strokeWidth={1 / scale}
              dash={[4 / scale, 4 / scale]}
              globalCompositeOperation="source-over"
              perfectDrawEnabled={false}
              shadowForStrokeEnabled={false}
              hitStrokeWidth={0}
            />
          </Layer>
        )}
      </Stage>
    </Box>
  );
};

export default App;

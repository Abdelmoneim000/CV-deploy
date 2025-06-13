import { useCvContext } from '../../../context/CvContext';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { LuGripVertical } from 'react-icons/lu';

const ReorganizePanel = () => {
  const { cvData, reorderSections } = useCvContext();
  const sections = cvData?.data?.sections;

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) return;
    reorderSections(source.index, destination.index);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">
        Reorganize Sections
      </h2>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-col gap-3"
              style={{ minHeight: `${sections.length * 56}px` }}
            >
              {sections.map((section, index) => (
                <Draggable
                  key={section.id}
                  draggableId={section.id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`relative flex items-center justify-between p-4 bg-white rounded-lg border 
                        shadow-sm transition-all duration-200 ease-in-out
                        ${
                          snapshot.isDragging
                            ? 'bg-blue-50 shadow-md scale-[1.02] z-10'
                            : ''
                        }
                        hover:shadow-md hover:bg-gray-50`}
                    >
                      <div className="flex items-center gap-3 text-gray-700 text-base font-medium">
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab text-gray-400 hover:text-gray-600"
                        >
                          <LuGripVertical size={20} />
                        </div>
                        {section.name}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default ReorganizePanel;

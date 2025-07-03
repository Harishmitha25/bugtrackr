import React from "react";
import { useDrag } from "react-dnd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import Tooltip from "@mui/material/Tooltip";

const STATUS_UPDATE_THRESHOLD = 24;

const BugCard = ({ bug, setSelectedBug }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "BUG",
    item: {
      bugId: bug.bugId,
      currentStatus: bug.status,
      priority: bug.priority,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(), //isDragging to help updaye UI during drag
    }),
  }));

  //Get hours since last status update
  const getHoursSinceStatusUpdate = (lastUpdated) => {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffInMs = now - updated;
    return diffInMs / (1000 * 60 * 60); //convert ms to hours
  };

  return (
    <div
      ref={drag}
      className={`p-3 border rounded-lg bg-white shadow-md mb-2 cursor-pointer ${
        isDragging ? "opacity-50" : ""
      }`}
      onClick={() => setSelectedBug(bug)}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-md font-semibold">{bug.title}</h3>
        {bug.statusLastUpdated &&
          getHoursSinceStatusUpdate(bug.statusLastUpdated) >
            STATUS_UPDATE_THRESHOLD && (
            <Tooltip title="No status update in over 24 hours">
              <div className="text-red-600 flex items-center gap-1 text-sm">
                <FontAwesomeIcon icon={faClock} />
              </div>
            </Tooltip>
          )}
      </div>

      <p className="text-sm text-gray-500">Bug ID: {bug.bugId}</p>
      <p className="text-sm text-gray-600">
        {bug.description.substring(0, 30)}...
      </p>
    </div>
  );
};

export default BugCard;

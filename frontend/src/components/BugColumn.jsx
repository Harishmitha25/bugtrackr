import React from "react";
import { useDrop } from "react-dnd";
import BugCard from "./BugCard";
import { toast } from "react-toastify";

const BugColumn = ({ status, bugs, moveBug, setSelectedBug }) => {
  console.log("Inside bug column");
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "BUG",
    drop: async (item) => {
      const { bugId, currentStatus, priority } = item;
      //Restrict critical bug direct closure
      if (
        priority === "Critical" &&
        currentStatus === "Tested & Verified" &&
        status === "Closed"
      ) {
        toast.error(
          "Critical bugs must be moved to 'Ready for Closure' first."
        );
        return;
      }

      await moveBug(bugId, status);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(), //isOver to update UI styles during dragging of bug card
    }),
  }));

  return (
    <div
      ref={drop}
      className={`w-1/3 p-4 border ${
        isOver ? "bg-blue-100" : "bg-gray-100"
      } rounded-lg shadow-md`}
    >
      <h2 className="text-lg font-bold mb-2">{status}</h2>{" "}
      {bugs.length > 0 ? (
        bugs.map((bug) => (
          <BugCard
            key={bug.bugId + bug.statusLastUpdated}
            bug={bug}
            setSelectedBug={setSelectedBug}
          />
        ))
      ) : (
        <p className="text-gray-500">No bugs</p>
      )}
    </div>
  );
};

export default BugColumn;

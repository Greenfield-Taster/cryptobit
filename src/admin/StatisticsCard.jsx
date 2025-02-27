import React from "react";

const StatisticsCard = ({ title, value, icon, change, changeType, color }) => {
  const getIconBackground = () => {
    switch (color) {
      case "primary":
        return "bg-primary";
      case "success":
        return "bg-success";
      case "warning":
        return "bg-warning";
      case "danger":
        return "bg-danger";
      case "info":
        return "bg-info";
      default:
        return "bg-primary";
    }
  };

  const getChangeClasses = () => {
    if (!change) return "";

    if (
      changeType === "positive" ||
      (typeof changeType === "undefined" && parseFloat(change) > 0)
    ) {
      return "positive";
    } else if (
      changeType === "negative" ||
      (typeof changeType === "undefined" && parseFloat(change) < 0)
    ) {
      return "negative";
    }

    return "";
  };

  const getChangeIcon = () => {
    const changeClass = getChangeClasses();

    if (changeClass === "positive") {
      return <i className="fas fa-arrow-up"></i>;
    } else if (changeClass === "negative") {
      return <i className="fas fa-arrow-down"></i>;
    }

    return null;
  };

  return (
    <div className="stat-card">
      <div className="stat-card-content">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>

        {change && (
          <div className={`stat-change ${getChangeClasses()}`}>
            {getChangeIcon()} {change}
          </div>
        )}
      </div>

      <div className={`stat-icon ${getIconBackground()}`}>
        <i className={`fas ${icon}`}></i>
      </div>
    </div>
  );
};

export default StatisticsCard;

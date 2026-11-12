
import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./reclamation.module.css";
import ReclamationListItem from "./ReclamationListItem";

const ReclamationListView = ({ items, getLocationNameById, ...props }) => {
    return (
    <div className={styles.reclamationList}>
      {items.map((item) => (
<ReclamationListItem 
          key={item.id} 
          item={item} 
          getLocationNameById={getLocationNameById} 
                    {...props} 
       
                    />
              ))}
    </div>
  );
};


export default ReclamationListView;
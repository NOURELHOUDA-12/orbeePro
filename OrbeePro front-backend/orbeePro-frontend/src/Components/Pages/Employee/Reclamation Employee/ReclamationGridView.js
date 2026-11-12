import React from "react";
import styles from "./reclamation.module.css";
import ReclamationGridCard from "./ReclamationGridCard";



const ReclamationGridView = ({ items, ...props }) => {
  return (
    <div className={styles.reclamationGridContainer}>
      {items.map((item) => (
        <ReclamationGridCard key={item.id} item={item} {...props} />
      ))}
    </div>
  );
};

export default ReclamationGridView;
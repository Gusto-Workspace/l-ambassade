import { useEffect, useState } from "react";

// AXIOS
import axios from "axios";

export default function RestaurantContext() {
  const [restaurantData, setRestaurantData] = useState(null);

  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  function fetchRestaurantData() {
    setDataLoading(true);
    setDataError(null);

    axios
      .get(
        `${process.env.NEXT_PUBLIC_API_URL}/restaurants/${process.env.NEXT_PUBLIC_RESTAURANT_ID}`,
      )
      .then((response) => {
        setRestaurantData(response.data.restaurant);

        setDataLoading(false);
      })
      .catch((error) => {
        setDataError(error);
        console.error(
          "Erreur lors de la récupération des données du restaurant:",
          error,
        );
        setDataLoading(false);
      });
  }

  useEffect(() => {
    fetchRestaurantData();
  }, []);

  return {
    restaurantData,
    setRestaurantData,
    dataLoading,
    dataError,
    fetchRestaurantData,
  };
}

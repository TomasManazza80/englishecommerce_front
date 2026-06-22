import { Add_to_cart, Remove_from_cart, Update_cart, Clear_cart } from "./CartActionType";

const getInitialCart = () => {
  try {
    const savedCart = localStorage.getItem('FEDECELL_CART');
    if (savedCart) {
      return JSON.parse(savedCart);
    }
  } catch (error) {
    console.error("Error loading cart from localStorage", error);
  }
  return [];
};

const initalCartStage = {
  cart: getInitialCart(),
};

const CartReducer = (state = initalCartStage, action) => {
  let newState;

  switch (action.type) {
    case Add_to_cart:
      newState = {
        ...state,
        cart: [...state.cart, action.payload],
      };
      break;
    case Update_cart:
      const { id, quantity, price } = action.payload;
      const newcart = state.cart.map((item) => {
        if (item.id === id) {
          return { ...item, quantity: quantity, total: quantity * price };
        }
        return item;
      });
      newState = {
        ...state,
        cart: newcart,
      };
      break;
    case Remove_from_cart:
    case "REMOVE_FROM_CART":
      newState = {
        ...state,
        cart: state.cart.filter((item) => item.id !== action.payload),
      };
      break;
    case Clear_cart:
      newState = {
        ...state,
        cart: [],
      };
      break;
    default:
      return state;
  }

  try {
    localStorage.setItem('FEDECELL_CART', JSON.stringify(newState.cart));
  } catch (error) {
    console.error("Error saving cart to localStorage", error);
  }

  return newState;
};

export { CartReducer };

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getProductById, getReviewsForTarget, createOrder, createEscrow,
  getWallet, getPlatformSettings, createNotification, getUserDoc, updateProduct,
  submitMomoPayment, debitWallet
} from "../firebase/db";
import { sendOrderPlacedEmail, sendMomoSubmittedEmail } from "../services/emailService";
import {
  Spinner, Button, Badge, Alert, StarRating, Modal,
  PriceTag, StatusBadge, ReportButton, VerifiedBadge, toast, FormInput
} from "../components/UI";
import { ReportModal } from "../components/ReportModal";
import ProductGallery from "../components/ProductGallery";
import { ShareProductButton } from "../components/ShareProduct";
import { SellerBadgeList } from "../components/SellerBadges";

/* ─────────────────────────────────────────────
   🔒 SNAPSHOT BUILDER (CORE FIX)
───────────────────────────────────────────── */
const buildOrderSnapshot = ({
  product,
  seller,
  buyer,
  qty,
  deliveryType,
  deliveryAddress,
  deliveryLandmark,
  preferredTime,
  deliveryNote,
  deliveryFee,
  settings,
}) => {
  const unitPrice = product.price;
  const subtotal = unitPrice * qty;
  const escrowFee = (subtotal * (settings.escrowFee || 2)) / 100;
  const commission = (subtotal * (settings.commissionRate || 10)) / 100;
  const total = subtotal + escrowFee + deliveryFee;

  return {
    product: {
      id: product.id,
      title: product.title,
      price: unitPrice,
      images: product.images || [],
    },
    seller: {
      id: product.sellerId,
      name: seller?.displayName || "",
    },
    buyer: {
      id: buyer.uid,
      name: buyer.displayName,
      phone: buyer.phone || "",
    },
    quantity: qty,
    pricing: {
      unitPrice,
      subtotal,
      escrowFee,
      commission,
      deliveryFee,
      total,
    },
    delivery: {
      type: deliveryType,
      address: deliveryAddress,
      landmark: deliveryLandmark,
      preferredTime,
      note: deliveryNote,
    },
    meta: {
      createdAt: new Date(),
      currency: "GHS",
    },
  };
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userDoc } = useAuth();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [seller, setSeller] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const [qty, setQty] = useState(1);
  const [processing, setProcessing] = useState(false);

  const [deliveryType, setDeliveryType] = useState("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLandmark, setDeliveryLandmark] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");

  const [senderPhone, setSenderPhone] = useState("");
  const [userRef, setUserRef] = useState("");

  /* ───────────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        const [p, r, s] = await Promise.all([
          getProductById(id),
          getReviewsForTarget(id),
          getPlatformSettings(),
        ]);
        setProduct(p);
        setReviews(r);
        setSettings(s);

        if (p?.sellerId) {
          const sellerDoc = await getUserDoc(p.sellerId);
          setSeller(sellerDoc);
        }

        await updateProduct(id, { views: (p.views || 0) + 1 });
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  /* ─────────────────────────────────────────────
     DELIVERY FEE (LOCKED BEFORE SNAPSHOT)
  ───────────────────────────────────────────── */
  const deliveryFee = (() => {
    if (deliveryType === "meetup") return 0;
    if (product?.deliveryFee > 0) return product.deliveryFee;
    return 10;
  })();

  /* ─────────────────────────────────────────────
     WALLET PAYMENT
  ───────────────────────────────────────────── */
  const handleWalletPay = async () => {
    setProcessing(true);

    try {
      const snapshot = buildOrderSnapshot({
        product,
        seller,
        buyer: {
          ...currentUser,
          displayName: userDoc?.displayName,
          phone: userDoc?.phone,
        },
        qty,
        deliveryType,
        deliveryAddress,
        deliveryLandmark,
        preferredTime,
        deliveryNote,
        deliveryFee,
        settings,
      });

      const wallet = await getWallet(currentUser.uid);

      if (wallet.balance < snapshot.pricing.total) {
        toast.error("Insufficient wallet balance");
        setProcessing(false);
        return;
      }

      await debitWallet(currentUser.uid, snapshot.pricing.total);

      const order = await createOrder({
        buyerId: snapshot.buyer.id,
        sellerId: snapshot.seller.id,
        status: "paid",
        paymentMethod: "wallet",
        total: snapshot.pricing.total,
        snapshot,
      });

      await createEscrow({
        orderId: order.id,
        amount: snapshot.pricing.subtotal,
        escrowFee: snapshot.pricing.escrowFee,
        commission: snapshot.pricing.commission,
        status: "held",
      });

      await createNotification(snapshot.seller.id, {
        title: "New Order",
        body: `${snapshot.buyer.name} ordered ${snapshot.product.title}`,
      });

      await sendOrderPlacedEmail(
        currentUser.email,
        snapshot.buyer.name,
        order.id,
        snapshot.pricing.total,
        snapshot.product.title
      );

      toast.success("Order placed");
      navigate(`/orders/${order.id}`);
    } catch (e) {
      toast.error(e.message);
    }

    setProcessing(false);
  };

  /* ─────────────────────────────────────────────
     MOMO PAYMENT
  ───────────────────────────────────────────── */
  const handleMomoSubmit = async () => {
    if (!userRef || !senderPhone) {
      return toast.error("Enter payment details");
    }

    setProcessing(true);

    try {
      const snapshot = buildOrderSnapshot({
        product,
        seller,
        buyer: {
          ...currentUser,
          displayName: userDoc?.displayName,
          phone: userDoc?.phone,
        },
        qty,
        deliveryType,
        deliveryAddress,
        deliveryLandmark,
        preferredTime,
        deliveryNote,
        deliveryFee,
        settings,
      });

      const order = await createOrder({
        buyerId: snapshot.buyer.id,
        sellerId: snapshot.seller.id,
        status: "awaiting_payment",
        paymentMethod: "momo",
        total: snapshot.pricing.total,
        snapshot,
        momo: {
          senderPhone,
          reference: userRef,
        },
      });

      await submitMomoPayment({
        orderId: order.id,
        amount: snapshot.pricing.total,
        senderPhone,
        reference: userRef,
      });

      await createNotification("admin", {
        title: "Payment to verify",
        body: `Order ${order.id}`,
      });

      await sendMomoSubmittedEmail(
        currentUser.email,
        snapshot.buyer.name,
        snapshot.pricing.total
      );

      toast.success("Payment submitted");
      navigate("/orders");
    } catch (e) {
      toast.error(e.message);
    }

    setProcessing(false);
  };

  if (loading) return <Spinner center />;
  if (!product) return null;

  return (
    <div className="page-wrapper">
      <div className="container">
        <h1>{product.title}</h1>

        <ProductGallery product={product} />

        <PriceTag amount={product.price} />

        <div>
          <button onClick={() => setQty(q => Math.max(1, q - 1))}>-</button>
          <span>{qty}</span>
          <button onClick={() => setQty(q + 1)}>+</button>
        </div>

        <div>
          <input
            placeholder="Delivery Address"
            value={deliveryAddress}
            onChange={e => setDeliveryAddress(e.target.value)}
          />
        </div>

        <div>
          <Button onClick={handleWalletPay} loading={processing}>
            Pay with Wallet
          </Button>
        </div>

        <div>
          <FormInput
            label="MoMo Phone"
            value={senderPhone}
            onChange={e => setSenderPhone(e.target.value)}
          />
          <FormInput
            label="Transaction Ref"
            value={userRef}
            onChange={e => setUserRef(e.target.value)}
          />
          <Button onClick={handleMomoSubmit} loading={processing}>
            Submit MoMo
          </Button>
        </div>
      </div>
    </div>
  );
}
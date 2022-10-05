import React from "react";
import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { GetServerSideProps } from "next";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getAuth } from "firebase/auth";
import {
  setDoc,
  updateDoc,
  getDoc,
  doc,
  getFirestore,
  collection,
} from "firebase/firestore";
import nookies from "nookies";
import dayjs from "dayjs";
import { initFirebaseAdminApp } from "../lib/firebase-admin";

type Props = {
  theme: "light" | "dark",
};

const Edit: NextPage<Props> = (props: Props) => {
  const initNames = [...Array(29)].map(() => "");
  const [names, setNames] = useState(initNames);
  const initCounts = [...Array(29)].map(() => 0);
  const [counts, setCounts] = useState(initCounts);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const inputs = document.querySelectorAll("input");
    if (props.theme === "light") {
      Array.from(inputs).forEach(e => e.classList.remove("member"));
    }
    else {
      Array.from(inputs).forEach(e => e.classList.add("member"));
    }
  }, [props.theme]);

  const fetchDocRef = () => {
    const db = getFirestore();
    const collectionRef = collection(db, "users");
    const auth = getAuth();
    const docRef = doc(collectionRef, auth.currentUser?.uid);
    return docRef;
  };

  useEffect(() => {
    const fetchDb = async () => {
      const docRef = fetchDocRef();
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNames(names.map((v, i) => data["memberName" + i.toString()]));
        setCounts(counts.map((v, i) => data["like" + i.toString()]));
      } else {
        const target = {
          created_at: dayjs().format(),
          updated_at: null,
        };
        const sources = [...Array(29)].map((v, i) => ({
          ["memberName" + i.toString()]: "",
          ["like" + i.toString()]: 0,
        }));
        const data = Object.assign(target, ...sources);
        await setDoc(docRef, data);
      }
      setLoaded(true);
    };
    fetchDb();
  }, []);

  const changeName = (index: number) => {
    return async (event: React.ChangeEvent<HTMLInputElement>) => {
      setNames(names.map((v, i) => (i === index ? event.target.value : v)));
      const docRef = fetchDocRef();
      const data = {
        ["memberName" + index.toString()]: event.target.value,
        updated_at: dayjs().format(),
      };
      await updateDoc(docRef, data);
    };
  };

  const increment = (index: number) => {
    return async () => {
      setCounts(counts.map((v, i) => (i === index ? v + 1 : v)));
      const docRef = fetchDocRef();
      const data = {
        ["like" + index.toString()]: counts[index] + 1,
        updated_at: dayjs().format(),
      };
      await updateDoc(docRef, data);
    };
  };

  const decrement = (index: number) => {
    return async () => {
      setCounts(counts.map((v, i) => (i === index && v !== 0 ? v - 1 : v)));
      const docRef = fetchDocRef();
      const data = {
        ["like" + index.toString()]:
          counts[index] === 0 ? 0 : counts[index] - 1,
        updated_at: dayjs().format(),
      };
      await updateDoc(docRef, data);
    };
  };

  const [resettable, setResettable] = useState([
    ...Array(29).map((v) => false),
  ]);
  const confirmReset = (index: number) => {
    return () =>
      setResettable(resettable.map((v, i) => (i === index ? true : v)));
  };

  const reset = (index: number) => {
    return async () => {
      setCounts(counts.map((v, i) => (i === index ? 0 : v)));
      setResettable(resettable.map((v, i) => (i === index ? false : v)));
      const docRef = fetchDocRef();
      const data = {
        ["like" + index.toString()]: 0,
        updated_at: dayjs().format(),
      };
      await updateDoc(docRef, data);
    };
  };

  const cancelReset = (index: number) => {
    return () =>
      setResettable(resettable.map((v, i) => (i === index ? false : v)));
  };

  const [allResettable, setAllResettable] = useState(false);
  const confirmAllReset = () => {
    setAllResettable(true);
  };

  const resetAll = async () => {
    setCounts(counts.map((v) => 0));
    setAllResettable(false);
    const docRef = fetchDocRef();
    const target = {
      updated_at: dayjs().format(),
    };
    const sources = [...Array(29)].map((v, i) => ({
      ["like" + i.toString()]: 0,
    }));
    const data = Object.assign(target, ...sources);
    await updateDoc(docRef, data);
  };

  const cancelAllReset = () => {
    setAllResettable(false);
  };

  return (
    <>
      {[...Array(29)].map((v, i) => (
        <div key={i}>
          <div className="container mt-3">
            <div className="mb-3">
              <label htmlFor={"name" + i.toString()} className="form-label">
                メンバー{i + 1}
              </label>
              <input
                className={`form-control ${props.theme === "light" ? "" : "bg-secondary text-light"}`}
                type="text"
                id={"memberName" + i.toString()}
                tabIndex={i + 1}
                value={names[i]}
                onChange={changeName(i)}
                disabled={!loaded}
                placeholder={
                  loaded
                    ? `メンバー${i + 1}の名前を入力してください`
                    : "ロード中…"
                }
              />
            </div>
            <div className="row">
              <div className="col">
                <button
                  type="button"
                  className={`btn ${props.theme === "light" ? "btn-outline-dark" : "btn-secondary"}`}
                  onClick={decrement(i)}
                  id={"minusButton" + i.toString()}
                >
                  －
                </button>
                <span className="ms-3 me-3" id={"count" + i.toString()}>
                  {loaded ? (
                    counts[i]
                  ) : (
                    <div
                      className="align-middle spinner-border spinner-border-sm"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  )}
                </span>
                <button
                  type="button"
                  className={`btn ${props.theme === "light" ? "btn-outline-dark" : "btn-secondary"}`}
                  onClick={increment(i)}
                  id={"plusButton" + i.toString()}
                >
                  ＋
                </button>
              </div>
              <div className="col text-end">
                {resettable[i] ? (
                  <div>
                    <button
                      type="button"
                      className={`btn ${props.theme === "light" ? "btn-outline-danger" : "btn-danger"} me-3`}
                      onClick={reset(i)}
                      id={"resetButton" + i.toString()}
                    >
                      <i className="bi bi-check-lg"></i>
                    </button>
                    <button
                      type="button"
                      className={`btn ${props.theme === "light" ? "btn-outline-dark" : "btn-secondary"}`}
                      onClick={cancelReset(i)}
                      id={"cancelResetButton" + i.toString()}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`btn ${props.theme === "light" ? "btn-outline-danger" : "btn-danger"}`}
                    onClick={confirmReset(i)}
                    id={"confirmResetButton" + i.toString()}
                  >
                    リセット
                  </button>
                )}
              </div>
            </div>
          </div>
          <hr />
        </div>
      ))}
      <div className="container mt-3 mb-5 text-end">
        {allResettable ? (
          <div>
            <button
              type="button"
              className={`btn ${props.theme === "light" ? "btn-outline-danger" : "btn-danger"} me-3`}
              onClick={resetAll}
              id="allResetButton"
            >
              <i className="bi bi-check-lg"></i>
            </button>
            <button
              type="button"
              className={`btn ${props.theme === "light" ? "btn-outline-dark" : "btn-secondary"}`}
              onClick={cancelAllReset}
              id="cancelAllResetButton"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`btn ${props.theme === "light" ? "btn-outline-danger" : "btn-danger"}`}
            onClick={confirmAllReset}
            id="confirmAllResetButton"
          >
            オールリセット
          </button>
        )}
      </div>
    </>
  );
};

export default Edit;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookie = nookies.get(context);
  const session = cookie.session;
  const theme = context.query.theme === "dark" ? "dark" : "light";
  if (!session) {
    return {
      redirect: {
        permanent: false,
        destination: "/?theme=" + theme,
      },
    };
  }

  initFirebaseAdminApp();

  try {
    await getAdminAuth().verifySessionCookie(session, true);
    return { props: {theme} };
  } catch (error) {
    console.error(error);
    return {
      redirect: {
        permanent: false,
        destination: "/?theme=" + theme,
      },
    };
  }
};

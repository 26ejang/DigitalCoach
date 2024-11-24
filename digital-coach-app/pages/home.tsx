import { NextPage } from "next";
import styles from "@App/styles/HomePage.module.scss";
import Link from "next/link";

const HomePage: NextPage = () => {
    return (
        <div className={styles.homePage}>
            {/* Hero */}
            <section className={styles.hero}>
                <h1 className={styles.heroTitle}>Welcome to Digital Coach!</h1>
                <p className={styles.heroDescription}> Master your interview skills with personalized feedback and real-world interview questions.</p>
                <Link href="/auth/signup">
                    <a className={styles.signupButton}>Get Started</a>
                </Link>
            </section>

            {/* Feature */}
            <section className={styles.features}>
                <h2 className={styles.featuresTitle}>Why choose Digital Coach?</h2>
                <div className={styles.featureList}>
                    <div className={styles.featureItem}>
                        <h3>Personalized AI feedback</h3>
                        <p>Receive customized feedback tailored to your personal performance to improve your interview skills and focus on key ares of growth.</p>
                    </div>
                    <div className={styles.featureItem}>
                        <h3>Real Interview Scenarios</h3>
                        <p>Practice with real-world interview questions focused on your department</p>
                    </div>
                    <div className={styles.featureItem}>
                        <h3>Track your progress</h3>
                        <p>Monitor your performance over time with detailed analytics and track your improvement</p>
                    </div>
                </div>
            </section>

            {/* Signup */}
            <section className={styles.signup}>
                <h2>Ready to take your interview skills to the next level?</h2>
                <Link href="/auth/signup">
                    <a className={styles.signupButton}>Sign Up</a>
                </Link>
            </section>
        </div>
    );
};

export default HomePage;
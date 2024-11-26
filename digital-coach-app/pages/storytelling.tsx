import { useState, useEffect, useRef } from 'react';
import Card from '@App/components/atoms/Card';
import AuthGuard from '@App/lib/auth/AuthGuard';
import { useReactMediaRecorder } from 'react-media-recorder';
import StorageService from '@App/lib/storage/StorageService';
import { v4 as uuidv4 } from 'uuid';
import styles from '@App/styles/StorytellingPage.module.scss';
import axios from 'axios';
import SelectQuestionSetCard from '@App/components/organisms/SelectQuestionSetCard';
import CircularProgressWithLabel from '@App/components/organisms/CircularProgressWithLabel';
import InterviewService from '@App/lib/interview/InterviewService';
import useAuthContext from '@App/lib/auth/AuthContext';
import { IBaseInterview } from '@App/lib/interview/models';

export default function StorytellingPage() {
  const { currentUser } = useAuthContext();
  const [isLocked, setIsLocked] = useState<any>(false);
  const [showQuestions, setShowQuestions] = useState<boolean>(false);
  const [showScenarios, setShowScenarios] = useState<boolean>(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [wasRecording, setWasRecording] = useState<any>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { status, startRecording, stopRecording, mediaBlobUrl, previewStream } =
    useReactMediaRecorder({ video: true });

  const [aggregateScore, setAggregateScore] = useState(0);
  const [jobId, setJobId] = useState('');
  const [feedback, setFeedback] = useState<any>([]);
  const [bigFive, setBigFive] = useState<any>({});

  const allSelectedItems = [...selectedQuestions, ...selectedScenarios];
  const canAddItem = allSelectedItems.length < 10;

  const sampleQuestions = [
    "What is your biggest achievement?",
    "How do you handle stress?",
    "What motivates you?",
    "What is your greatest fear?",
    "How do you define success?",
    "What are your goals for the future?",
    "Tell us about a time you overcame a challenge.",
    "What are your strengths?",
    "What are your weaknesses?",
    "How do you deal with conflict?",
    "What’s your favorite book and why?",
    "What’s the best advice you’ve ever received?",
    "Tell us about a time you worked in a team.",
    "How do you stay organized?",
    "What’s your favorite hobby?",
    "What’s your dream job?",
    "Tell us about a time you failed.",
    "What would you do if you won the lottery?",
    "What do you value most in life?",
    "Describe a person who influenced you.",
    "How do you handle failure?",
    "What would your friends say about you?",
    "What’s your biggest passion?",
    "Tell us about a time you took a risk.",
    "What is your approach to problem-solving?",
    "What makes you happy?",
    "How do you stay motivated?",
    "What’s your biggest challenge right now?",
    "What’s your favorite way to relax?",
    "How do you handle criticism?",
    // Add more questions here...
  ];

  const sampleScenarios = [
    "Imagine you’re leading a team and one member consistently misses deadlines. How would you handle this?",
    "You’re tasked with delivering a presentation to a group of executives. How would you prepare?",
    "Describe how you would approach a difficult customer complaint about a product.",
    "Imagine you’ve been assigned a project with a tight deadline. How would you ensure timely completion?",
    "How would you handle a situation where your team is divided on a decision?",
    "If you were asked to train a new employee, how would you approach it?",
    "You’re asked to make a major decision with limited data. How would you proceed?",
    "How would you respond to a colleague who challenges your authority in a meeting?",
    "Imagine you’ve been given a leadership role in a crisis situation. How would you manage the team?",
    "You’ve been given feedback that you’re not managing your time effectively. How would you address this?",
    // Add more scenarios here...
  ];

  const selectQuestion = (question: string) => {
    if (canAddItem && !selectedQuestions.includes(question)) {
      setSelectedQuestions((prev) => [...prev, question]);
    }
  };

  const selectScenario = (scenario: string) => {
    if (canAddItem && !selectedScenarios.includes(scenario)) {
      setSelectedScenarios((prev) => [...prev, scenario]);
    }
  };

  const toggleQuestionsVisibility = () => {
    setShowQuestions(prev => !prev);
  };

  const toggleScenariosVisibility = () => {
    setShowScenarios(prev => !prev);
  };

  const cycleItem = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setCurrentIndex((prev) => (prev + 1) % (selectedQuestions.length + selectedScenarios.length));
    } else {
      setCurrentIndex(
        (prev) => (prev - 1 + (selectedQuestions.length + selectedScenarios.length)) % (selectedQuestions.length + selectedScenarios.length)
      );
    }
  };

  const resetItems = () => {
    setSelectedQuestions([]);
    setSelectedScenarios([]);
    setCurrentIndex(0);
  };

  const saveRecording = async () => {
    const getFile = async () => {
      const url = mediaBlobUrl ? mediaBlobUrl : '';
      let blob = await fetch(url).then((res) => res.blob());
      // const blob = new Blob([data as BlobPart], {
      // type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // });
      // const blobPart = new Blob([blob as BlobPart]);
      return new File([blob], 'video.mp4');
    };
    const file = await getFile();


    const url = (await StorageService.uploadAnswerVideo(file, uuidv4())) as any;
    const dlURL = await StorageService.getDownloadUrlFromVideoUrlRef(
      'gs://' + url.ref._location.bucket + '/' + url.ref._location.path
    );
    try {
      const response = await axios.post('http://localhost:8000/predict', {
        videoUrl: dlURL,
      });
	  setJobId(response.data.message.split(' ')[1]);
    } catch (e) {
      console.log(e);
    }

  };

  const getResults = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8000/results/' + jobId
      );
      if (response.data.result) {
        setAggregateScore(response.data.result.evaluation.aggregateScore);
        setBigFive(response.data.result.evaluation.bigFive);
		InterviewService.create(currentUser!.id, { title: 'Test'} as IBaseInterview, response.data.result.evaluation);
        // Now need to give feedback based on Big Five Score
        let userFeedback = [];
        // Openness feedback
        if (response.data.result.evaluation.bigFive.o < -3) {
          userFeedback.push(
            'With an Openness score less that -3, you are more likely to stick to your routines, avoid change and follow a traditional thought process.'
          );
        } else if (
          -3 <= response.data.result.evaluation.bigFive.o &&
          response.data.result.evaluation.bigFive.o <= 3
        ) {
          userFeedback.push(
            'With an Openness score between -3 and 3, you are somewhat open to new experiences and creative, but you still enjoy some structure and consistency.'
          );
        } else if (response.data.result.evaluation.bigFive.o > 3) {
          userFeedback.push(
            'With an Openness score greater that 3, you likely enjoy trying new things, are creative and imaginative and can easily think about problems in different ways.'
          );
        }

        // Conscientiousness feedback
        if (response.data.result.evaluation.bigFive.c < -3) {
          userFeedback.push(
            'With a Conscientiousness score less that -3, you are likely less organized and more willing to finish tasks at the last minute.'
          );
        } else if (
          -3 <= response.data.result.evaluation.bigFive.c &&
          response.data.result.evaluation.bigFive.c <= 3
        ) {
          userFeedback.push(
            'With a Conscientiousness score between -3 and 3, you accept some level of order, but also like doing some things at your own pace.'
          );
        } else if (response.data.result.evaluation.bigFive.c > 3) {
          userFeedback.push(
            'With a Conscientiousness score greater that 3, you are always prepared, keep things in order and are very goal driven.'
          );
        }

        // Extraversion feedback
        if (response.data.result.evaluation.bigFive.e < -3) {
          userFeedback.push(
            'With an Extraversion score less that -3, you may struggle to socialize and prefer keeping to yourself.'
          );
        } else if (
          -3 <= response.data.result.evaluation.bigFive.e &&
          response.data.result.evaluation.bigFive.e <= 3
        ) {
          userFeedback.push(
            'With an Extraversion score between -3 and 3, you enjoy your personal time but also like the occasional exciting activity or large gathering.'
          );
        } else if (response.data.result.evaluation.bigFive.e > 3) {
          userFeedback.push(
            'With an Extraversion score greater that 3, you live for excitement and like to be around others. You recharge with others rather than without them.'
          );
        }

        // Agreeableness feedback
        if (response.data.result.evaluation.bigFive.a < -3) {
          userFeedback.push(
            'With an Agreeableness score less that -3, you likely focus more on yourself and care less about how others feel about you.'
          );
        } else if (
          -3 <= response.data.result.evaluation.bigFive.a &&
          response.data.result.evaluation.bigFive.a <= 3
        ) {
          userFeedback.push(
            'With an Agreeableness score between -3 and 3, you are willing to help others and care about them, but stil prioritize yourself'
          );
        } else if (response.data.result.evaluation.bigFive.a > 3) {
          userFeedback.push(
            'With an Agreeableness score greater that 3, you care about others, are always ready to help them and see the best in them'
          );
        }

        // Neuroticism feedback
        if (response.data.result.evaluation.bigFive.n < -3) {
          userFeedback.push(
            'With a Neuroticism score less that -3, you are able to remain calm even in high stress situations. You also remain optimistic and do not worry so much.'
          );
        } else if (
          -3 <= response.data.result.evaluation.bigFive.n &&
          response.data.result.evaluation.bigFive.n <= 3
        ) {
          userFeedback.push(
            'With a Neuroticism score between -3 and 3, you have some confidence in yourself and can stay calm in somewhat stressful situations, but still carry self doubts.'
          );
        } else if (response.data.result.evaluation.bigFive.n > 3) {
          userFeedback.push(
            'With a Neuroticism score greater that 3, you may be very insecure and get stressed out easily, and you tend to blame yourself when things go wrong.'
          );
        }

        // Output the feedback on the screen for the user
        setFeedback(userFeedback);
        console.log(userFeedback);
      } else {
        alert(
          'The results are not ready yet. Please try again in a minute or so'
        );
      }
    } catch (e) {
    }
  };
  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  return (
    <AuthGuard>
        <div>
        {/* <p className={styles.thing}>{status}</p> */}
            <div className={styles.videoBox}>
                <video src={mediaBlobUrl!} controls />
                <video ref={videoRef} controls autoPlay />
            </div>
            <div className={styles.buttonBox}>
                <button className={styles.recordButton} onClick={() => {
                  setIsLocked(true);
                  setWasRecording(true);
                  startRecording();
                }}>Start Recording</button>
                <button className={styles.recordButton} onClick={() => {
                  setIsLocked(false);
                  if(wasRecording) {
                    setQuestions([]);
                    setShowQuestions(false);
                    setShowScenarios(false);
                    setWasRecording(false);
                  }
                  stopRecording();
                }}>Stop Recording</button>
                {mediaBlobUrl && (
                  <button className={styles.saveButton} onClick={saveRecording}>Save Recording</button>
                )}
                <button className={styles.resultButton} onClick={getResults}>Get Results</button>
            </div>
            <p className={styles.score}>Most Recent Score: </p>
            {aggregateScore !== 0 && (<CircularProgressWithLabel value={aggregateScore} />)}
        </div>
        {/* Selected Item Slideshow */}
        {allSelectedItems.length > 0 ? (
          <div className={styles.itemSlideshow}>
            <h3>{allSelectedItems[currentIndex]}</h3>
            <div className={styles.buttonContainer}>
              <button className={styles.prevButton} onClick={() => cycleItem('prev')}>Previous</button>
              <button className={styles.nextButton} onClick={() => cycleItem('next')}>Next</button>
            </div>
          </div>
        ) : (
          <p>No items selected yet</p>
        )}

        {/* Reset Button */}
        <div className={styles.buttonBox}>
          <button className={styles.resetButton} onClick={resetItems}>Reset Selections</button>
        </div>

        <div className={styles.browseSectionContainer}>
          {/* Browse Questions */}
          <div className={styles.browseSection}>
            <button className={styles.browseButton} onClick={toggleQuestionsVisibility}>
              {showQuestions ? 'Hide Questions' : 'Browse Questions'}
            </button>
            {showQuestions && (
              <div className={styles.questionList}>
                {sampleQuestions.map((question, index) => (
                  <div key={index}>
                    <button
                      className={styles.questionButton} 
                      disabled={selectedQuestions.includes(question)}
                      onClick={() => selectQuestion(question)}>{question}</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Browse Scenarios */}
          <div className={styles.browseSection}>
            <button className={styles.browseButton} onClick={toggleScenariosVisibility}>
              {showScenarios ? 'Hide Scenarios' : 'Browse Scenarios'}
            </button>
            {showScenarios && (
              <div className={styles.scenarioList}>
                {sampleScenarios.map((scenario, index) => (
                  <div key={index}>
                    <button
                      className={styles.questionButton}
                      disabled={selectedScenarios.includes(scenario)}
                      onClick={() => selectScenario(scenario)}>{scenario}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        

        {feedback.length !== 0 && Object.keys(bigFive).length !== 0 && (
        <div>
            <Card title='Big Five Score'>
                <p>Openness Score: {bigFive.o}</p>
                <p>Conscientiousness Score: {bigFive.c}</p>
                <p>Extraversion Score: {bigFive.e}</p>
                <p>Agreeableness Score: {bigFive.a}</p>
                <p>Neuroticism Score: {bigFive.n}</p>
            </Card>
            <Card title='Big Five Feedback'>
                {feedback.map((thisFeedback: string) => {
                return <p>{thisFeedback}</p>;
                })}
            </Card>
        </div>
    )}
    </AuthGuard>
    );
}

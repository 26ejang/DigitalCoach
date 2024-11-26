import { useState, useEffect, useRef } from 'react';
import Card from '@App/components/atoms/Card';
import AuthGuard from '@App/lib/auth/AuthGuard';
import { useReactMediaRecorder } from 'react-media-recorder';
import StorageService from '@App/lib/storage/StorageService';
import { v4 as uuidv4 } from 'uuid';
import styles from '@App/styles/VideoPage.module.scss';
import axios from 'axios';
import SelectQuestionSetCard from '@App/components/organisms/SelectQuestionSetCard';
import CircularProgressWithLabel from '@App/components/organisms/CircularProgressWithLabel';
import InterviewService from '@App/lib/interview/InterviewService';
import useAuthContext from '@App/lib/auth/AuthContext';
import { IBaseInterview } from '@App/lib/interview/models';

export default function VideoPage() {
  const { currentUser } = useAuthContext();
  const [isLocked, setIsLocked] = useState<any>(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [showQuestions, setShowQuestions] = useState<any>(true);
  const [wasRecording, setWasRecording] = useState<any>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { status, startRecording, stopRecording, mediaBlobUrl, previewStream } =
    useReactMediaRecorder({ video: true });

  const [aggregateScore, setAggregateScore] = useState(0);
  const [jobId, setJobId] = useState('');
  const [feedback, setFeedback] = useState<any>([]);
  const [bigFive, setBigFive] = useState<any>({});

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
              if (wasRecording) {
                setQuestions([]);
                setShowQuestions(false);
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
        {aggregateScore !== 0 && (
          <CircularProgressWithLabel value={aggregateScore} />
        )}
      </div>
      <SelectQuestionSetCard
        isLocked={isLocked}
        setIsLocked={setIsLocked}
        questions={questions}
        setQuestions={setQuestions}
        showQuestions={showQuestions}
        setShowQuestions={setShowQuestions}
      />
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

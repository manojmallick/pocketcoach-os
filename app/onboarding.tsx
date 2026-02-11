import Button from '@/components/Button';
import Typography from '@/components/Typography';
import { upsertUserContext } from '@/lib/db';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TIME_OPTIONS = [10, 20, 30, 45, 60];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [project, setProject] = useState('');
  const [blocker, setBlocker] = useState('');
  const [timeDailyMin, setTimeDailyMin] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    setError('');

    if (step === 1) {
      if (!project.trim()) {
        setError('Please enter your project');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!blocker.trim()) {
        setError('Please enter your main blocker');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      // Final step - save to Supabase
      setLoading(true);
      
      try {
        const { error: dbError } = await upsertUserContext({
          project: project.trim(),
          blocker: blocker.trim(),
          time_daily_min: timeDailyMin,
          tone: 'direct',
        });

        if (dbError) {
          setError('Failed to save. Please try again.');
          setLoading(false);
          return;
        }

        // Save onboarding completion to AsyncStorage
        const userContext = {
          onboardingCompleted: true,
          createdAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem('user_context', JSON.stringify(userContext));

        // Navigate to library
        router.replace('/(drawer)/library');
      } catch (err) {
        console.error('Onboarding error:', err);
        setError('Something went wrong. Please try again.');
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canContinue = () => {
    if (step === 1) return project.trim().length > 0;
    if (step === 2) return blocker.trim().length > 0;
    if (step === 3) return timeDailyMin > 0;
    return false;
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'What are you working on?';
      case 2:
        return "What's blocking you?";
      case 3:
        return 'How much time daily?';
      default:
        return 'Welcome to PocketCoach';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1:
        return 'Tell us about your main project or goal';
      case 2:
        return "What's your biggest challenge right now?";
      case 3:
        return 'How many minutes can you commit per day?';
      default:
        return "Let's get started";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Stepper */}
        <View style={styles.stepper}>
          {[1, 2, 3].map((num) => (
            <View key={num} style={styles.stepperItem}>
              <View
                style={[
                  styles.stepperCircle,
                  step >= num && styles.stepperCircleActive,
                  step > num && styles.stepperCircleComplete,
                ]}
              >
                <Typography
                  variant="caption"
                  style={[
                    styles.stepperNumber,
                    step >= num ? styles.stepperNumberActive : {},
                  ]}
                >
                  {num}
                </Typography>
              </View>
              {num < 3 && (
                <View
                  style={[
                    styles.stepperLine,
                    step > num && styles.stepperLineActive,
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        <View style={styles.header}>
          <Typography variant="h1" style={styles.title}>
            {getStepTitle()}
          </Typography>
          <Typography variant="body" style={styles.subtitle}>
            {getStepSubtitle()}
          </Typography>
        </View>

        <View style={styles.form}>
          {step === 1 && (
            <>
              <Typography variant="h3" style={styles.label}>
                Your Project
              </Typography>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={project}
                onChangeText={setProject}
                placeholder="e.g., Launch my fitness app, Write my book, Start a business..."
                placeholderTextColor="#CCCCCC"
                multiline
                numberOfLines={3}
                autoFocus
              />
            </>
          )}

          {step === 2 && (
            <>
              <Typography variant="h3" style={styles.label}>
                Your Main Blocker
              </Typography>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={blocker}
                onChangeText={setBlocker}
                placeholder="e.g., Procrastination, Time management, Fear of failure..."
                placeholderTextColor="#CCCCCC"
                multiline
                numberOfLines={3}
                autoFocus
              />
            </>
          )}

          {step === 3 && (
            <>
              <Typography variant="h3" style={styles.label}>
                Daily Time Commitment
              </Typography>
              <View style={styles.timeOptions}>
                {TIME_OPTIONS.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeOption,
                      timeDailyMin === time && styles.timeOptionActive,
                    ]}
                    onPress={() => setTimeDailyMin(time)}
                  >
                    <Typography
                      variant="h2"
                      style={[
                        styles.timeOptionNumber,
                        timeDailyMin === time ? styles.timeOptionNumberActive : {},
                      ]}
                    >
                      {time}
                    </Typography>
                    <Typography
                      variant="caption"
                      style={[
                        styles.timeOptionLabel,
                        timeDailyMin === time ? styles.timeOptionLabelActive : {},
                      ]}
                    >
                      minutes
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Typography variant="body" style={styles.errorText}>
              {error}
            </Typography>
          </View>
        ) : null}

        <View style={styles.footer}>
          {step > 1 && (
            <Button 
              title="Back" 
              onPress={handleBack} 
              variant="secondary"
              style={styles.backButton}
              disabled={loading}
            />
          )}
          <Button 
            title={loading ? 'Saving...' : step === 3 ? 'Get Started' : 'Continue'} 
            onPress={handleContinue}
            disabled={!canContinue() || loading}
          />
          {loading && (
            <ActivityIndicator style={styles.loader} color="#000000" />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 24,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  stepperItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  stepperCircleActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  stepperCircleComplete: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  stepperNumber: {
    color: '#999999',
    fontWeight: '600',
  },
  stepperNumberActive: {
    color: '#FFFFFF',
  },
  stepperLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 4,
  },
  stepperLineActive: {
    backgroundColor: '#000000',
  },
  header: {
    marginTop: 20,
  },
  title: {
    marginBottom: 12,
  },
  subtitle: {
    color: '#666666',
  },
  form: {
    flex: 1,
    marginTop: 40,
  },
  label: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 56,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeOption: {
    flex: 1,
    minWidth: 90,
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  timeOptionActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  timeOptionNumber: {
    fontWeight: '700',
    color: '#000000',
  },
  timeOptionNumberActive: {
    color: '#FFFFFF',
  },
  timeOptionLabel: {
    marginTop: 4,
    color: '#666666',
  },
  timeOptionLabelActive: {
    color: '#FFFFFF',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    color: '#C62828',
    textAlign: 'center',
  },
  footer: {
    gap: 12,
    marginTop: 40,
    position: 'relative',
  },
  backButton: {
    marginBottom: 8,
  },
  loader: {
    position: 'absolute',
    right: 24,
    top: 16,
  },
});

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getCurrentUser, subscribeUserProfile, UserProfile } from '../../lib/auth';
import { addIceCandidate, CallSession, subscribeCall, subscribeIceCandidates, updateCall } from '../../lib/firestore';
let RTCPeerConnection: any, RTCIceCandidate: any, RTCSessionDescription: any, RTCView: any, mediaDevices: any;
try {
  const webrtc = require('react-native-webrtc/lib/commonjs');
  RTCPeerConnection = webrtc.RTCPeerConnection;
  RTCIceCandidate = webrtc.RTCIceCandidate;
  RTCSessionDescription = webrtc.RTCSessionDescription;
  RTCView = webrtc.RTCView;
  mediaDevices = webrtc.mediaDevices;
} catch (e) {
  RTCPeerConnection = null;
  RTCIceCandidate = null;
  RTCSessionDescription = null;
  RTCView = null;
  mediaDevices = null;
}

export default function CallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const callId = (params.id as string) || '';
  const role = (params.role as string) || '';
  const [call, setCall] = useState<CallSession | null>(null);
  const [peerProfile, setPeerProfile] = useState<UserProfile | null>(null);
  const currentUser = getCurrentUser();
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const ringTimerRef = useRef<any>(null);
  const durationTimerRef = useRef<any>(null);
  const durationStartRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState<string>('00:00');

  useEffect(() => {
    if (!callId) return;
    const unsub = subscribeCall(callId, setCall);
    return () => unsub();
  }, [callId]);

  useEffect(() => {
    if (!call) return;
    const peerId = (currentUser?.uid === call.callerId ? call.calleeId : call.callerId) as string;
    const unsub = subscribeUserProfile(peerId, setPeerProfile);
    return () => unsub();
  }, [call, currentUser?.uid]);

  useEffect(() => {
    if (!call) return;
    const isCaller = currentUser ? (currentUser.uid === call.callerId) : (role !== 'callee');
    if (!isCaller && (call.status === 'initiated')) {
      updateCall(callId, { status: 'ringing' }).catch(() => { });
    }
    if (isCaller && call.status === 'initiated' && !ringTimerRef.current) {
      ringTimerRef.current = setTimeout(() => {
        updateCall(callId, { status: 'missed', endedAt: new Date() }).catch(() => { });
        router.back();
      }, 30000);
    }
    if (call.status === 'connected' && ringTimerRef.current) {
      clearTimeout(ringTimerRef.current);
      ringTimerRef.current = null;
    }
  }, [call, currentUser, router, role, callId]);

  const endCall = async () => {
    if (callId) await updateCall(callId, { status: 'ended', endedAt: new Date() });
    try {
      pcRef.current?.close();
    } catch { }
    try {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      durationStartRef.current = null;
      setElapsed('00:00');
    } catch { }
    router.back();
  };

  const ensurePeer = React.useCallback(() => {
    if (pcRef.current) return pcRef.current;
    if (!RTCPeerConnection) return null;
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
    } as any);
    (pc as any).addEventListener('icecandidate', (event: any) => {
      if (event.candidate && currentUser) {
        addIceCandidate(callId, currentUser.uid, event.candidate).catch(() => { });
      }
    });
    (pc as any).addEventListener('track', (event: any) => {
      const stream = event.streams?.[0] || null;
      if (stream) setRemoteStream(stream);
    });
    pcRef.current = pc;
    return pc;
  }, [currentUser, callId]);

  const setupLocalStream = React.useCallback(async () => {
    if (!mediaDevices || !RTCPeerConnection) return null;
    const isVideo = call?.type === 'video';
    const s = await mediaDevices.getUserMedia({ audio: true, video: isVideo });
    const pc = ensurePeer();
    s.getTracks().forEach((t: any) => pc.addTrack(t, s));
    return pc;
  }, [call?.type, ensurePeer]);

  const startCaller = React.useCallback(async () => {
    if (!call || !currentUser || !RTCPeerConnection) return;
    const pc = await setupLocalStream();
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: call.type === 'video' } as any);
    await pc.setLocalDescription(offer);
    await updateCall(callId, { offerSDP: JSON.stringify(offer) });
    subscribeIceCandidates(callId, call.calleeId, async (cand) => {
      try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch { }
    });
  }, [call, currentUser, callId, setupLocalStream]);

  const acceptCall = async () => {
    if (!call || !RTCPeerConnection) return;
    const pc = await setupLocalStream();
    const offer = call.offerSDP ? JSON.parse(call.offerSDP) : null;
    if (offer) await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await updateCall(callId, { answerSDP: JSON.stringify(answer), status: 'connected' });
    subscribeIceCandidates(callId, call.callerId, async (cand) => {
      try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch { }
    });
  };

  const rejectCall = async () => {
    await updateCall(callId, { status: 'ended', endedAt: new Date() });
    router.back();
  };

  useEffect(() => {
    const run = async () => {
      if (!call || !currentUser) return;
      if (currentUser.uid === call.callerId) {
        if (call.status === 'initiated') await startCaller();
        if (call.answerSDP && pcRef.current) {
          const answer = JSON.parse(call.answerSDP);
          try { await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer)); } catch { }
        }
      }
    };
    run();
  }, [call, currentUser, callId, startCaller]);

  useEffect(() => {
    if (!call) return;
    if (call.status === 'connected') {
      if (!durationTimerRef.current) {
        durationStartRef.current = Date.now();
        durationTimerRef.current = setInterval(() => {
          const start = durationStartRef.current || Date.now();
          const diff = Date.now() - start;
          const mm = Math.floor(diff / 60000);
          const ss = Math.floor((diff % 60000) / 1000);
          setElapsed(`${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`);
        }, 1000);
      }
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      if (call.status === 'ended' || call.status === 'missed') {
        durationStartRef.current = null;
        setElapsed('00:00');
      }
    }
  }, [call]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        {call?.type === 'video' && remoteStream ? (
          <RTCView streamURL={remoteStream.toURL()} style={{ width: '100%', height: 300, marginBottom: 12 }} />
        ) : (
          peerProfile?.photoURL ? (
            <Image source={{ uri: peerProfile.photoURL }} style={styles.avatar} />
          ) : (
            <Image source={require('../../assets/images/avatar.png')} style={styles.avatar} />
          )
        )}
        <Text style={styles.peerName}>{peerProfile?.displayName || 'Contact'}</Text>
        <Text style={styles.subtitle}>{call?.status === 'connected' ? elapsed : call?.status || 'Calling...'}</Text>
        <View style={styles.controls}>
          <TouchableOpacity style={[styles.circleButton, styles.mute]}>
            <Text style={styles.controlText}>Mute</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.circleButton, styles.speaker]}>
            <Text style={styles.controlText}>Speaker</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.circleButton, styles.keypad]}>
            <Text style={styles.controlText}>Keypad</Text>
          </TouchableOpacity>
        </View>
        {call && (role === 'callee' || (currentUser && currentUser.uid === call.calleeId)) && (call.status === 'initiated' || call.status === 'ringing') && (
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            <TouchableOpacity style={[styles.circleButton, styles.accept]} onPress={acceptCall}>
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.circleButton, styles.reject]} onPress={rejectCall}>
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity style={styles.endCircle} onPress={endCall}>
          <Text style={styles.hangupText}>End</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 12 },
  peerName: { color: 'white', fontSize: 20, fontWeight: '600', marginBottom: 4 },
  subtitle: { color: '#E5E7EB', fontSize: 14, marginBottom: 20 },
  controls: { flexDirection: 'row', marginBottom: 20 },
  circleButton: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
  controlText: { color: 'white', fontWeight: '500' },
  mute: { backgroundColor: '#374151' },
  speaker: { backgroundColor: '#4B5563' },
  keypad: { backgroundColor: '#6B7280' },
  accept: { backgroundColor: '#16A34A' },
  acceptText: { color: 'white', fontWeight: '600' },
  reject: { backgroundColor: '#EF4444' },
  rejectText: { color: 'white', fontWeight: '600' },
  endCircle: { backgroundColor: '#EF4444', width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  hangupText: { color: 'white', fontWeight: '600' },
});
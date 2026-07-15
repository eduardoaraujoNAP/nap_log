import { Redirect } from 'expo-router';
import { useApp } from '../src/session/AppContext';
export default function Index() { return <Redirect href={useApp().signedIn ? '/journey' : '/login'} />; }

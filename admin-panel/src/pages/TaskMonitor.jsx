import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collectionGroup, onSnapshot, query } from 'firebase/firestore'; // ✅ Removed orderBy
import { ClipboardList, CheckCircle2, Clock, User, Calendar, Loader2 } from 'lucide-react';

const TaskMonitor = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 📡 STEP 1: Simple query (No orderBy = NO INDEX NEEDED!)
    const q = query(collectionGroup(db, 'tasks'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 📡 STEP 2: Sort manually in Javascript (Better than fighting Firebase!)
      const sortedTasks = taskList.sort((a, b) => {
        return (a.deadline?.seconds || 0) - (b.deadline?.seconds || 0);
      });

      setTasks(sortedTasks);
      setLoading(false);
    }, (err) => {
      console.error("Firestore Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ padding: '20px', background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="page-header" style={{ marginBottom: '30px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={22} />
          </div>
          User Task Planner
        </h1>
        <p style={{ color: 'var(--text-medium)', marginTop: '5px', fontSize: '14px' }}>Showing every user task synced from the app</p>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>User & Event</th>
              <th>Task Details</th>
              <th>Deadline</th>
              <th style={{ textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingState />
            ) : tasks.length === 0 ? (
              <EmptyState />
            ) : (
              tasks.map((task) => <TaskRow key={task.id} task={task} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TaskRow = ({ task }) => {
  const now = new Date().getTime();
  const isOverdue = !task.isCompleted && task.deadline?.seconds * 1000 < now;
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '14px' }}>
            {task.userName ? task.userName[0].toUpperCase() : 'U'}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{task.userName || 'Anonymous'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <Calendar size={12} /> {task.eventName || 'No Event Name'}
            </div>
          </div>
        </div>
      </td>
      <td style={{ padding: '16px 20px' }}>
        <div style={{ fontWeight: 600, fontSize: '14px', color: task.isCompleted ? 'var(--text-light)' : 'var(--text-dark)', textDecoration: task.isCompleted ? 'line-through' : 'none' }}>
          {task.taskName}
        </div>
      </td>
      <td style={{ padding: '16px 20px', fontWeight: 700, fontSize: '12px', color: 'var(--text-medium)' }}>
        {task.deadline?.seconds 
          ? new Date(task.deadline.seconds * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) 
          : 'TBD'}
        {isOverdue && <div style={{ color: 'var(--error)', fontSize: '11px', fontWeight: 700, marginTop: '4px' }}>OVERDUE</div>}
      </td>
      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
        <span className={`status-badge ${task.isCompleted ? 'approved' : 'pending'}`}>
          {task.isCompleted ? 'DONE' : 'PENDING'}
        </span>
      </td>
    </tr>
  );
};

const LoadingState = () => (
  <tr><td colSpan="4" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-medium)' }}><Loader2 style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />Loading...</td></tr>
);

const EmptyState = () => (
  <tr><td colSpan="4" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-medium)' }}>No tasks found. Try adding a task in the Flutter app!</td></tr>
);

export default TaskMonitor;
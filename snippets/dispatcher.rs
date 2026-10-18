fn receive(
    &self,
    context: &ActorContext<Self::Message>,
    incoming: Incoming<Self::Message>,
    count: Self::State,
) -> Result<Control<Self::State>, Self::Error> {
    if let Incoming::Message(Job(job)) = incoming {
        let worker = context.spawn(Worker);
        worker.tell(Work(job));
    }
    Ok(Control::Continue(count + 1))
}
